import { Router, type IRouter, type Response } from "express";
import { randomUUID } from "node:crypto";
import { persistCreatedPaymentLink } from "@workspace/db/prisma";
import { logger } from "../lib/logger";

type PaymentLinkRequest = {
  amount?: unknown;
  currency?: unknown;
  description?: unknown;
  customer?: {
    name?: unknown;
    email?: unknown;
    contact?: unknown;
  };
  notes?: Record<string, string>;
};

const supportedCurrencies = new Set(["INR", "USD", "EUR", "GBP"]);
const router: IRouter = Router();

function errorResponse(res: Response, message: string, status: number) {
  return res.status(status).json({ error: message });
}

function isAuthenticationError(status: number | undefined, message: string) {
  return (
    status === 401 ||
    /authentication failed|unauthori[sz]ed|invalid (?:api )?key|invalid credential/i.test(
      message,
    )
  );
}

async function createDemoPaymentLinkResponse(
  res: Response,
  input: {
    amount: number;
    currency: string;
    description: string;
    customer: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
  },
) {
  const demoId = `demo_settley_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const shortUrl = `https://razorpay.com/pay/${demoId}`;

  let orderId = `DEMO-${demoId.replace("demo_settley_", "").toUpperCase()}`;
  let transactionId: string | undefined;

  try {
    const persisted = await persistCreatedPaymentLink({
      razorpayId: demoId,
      shortUrl,
      providerStatus: "demo",
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerContact: input.customer.contact,
      notes: input.notes,
    });
    orderId = persisted.transaction.orderId;
    transactionId = persisted.transaction.id;
  } catch (error) {
    logger.error({ err: error }, "Unable to persist demo payment link");
  }

  return res.json({
    id: demoId,
    short_url: shortUrl,
    status: "created",
    amount: input.amount,
    currency: input.currency,
    created_at: Math.floor(Date.now() / 1000),
    order_id: orderId,
    transaction_id: transactionId,
    demo: true,
  });
}

router.post("/create-payment-link", async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const body = (req.body ?? {}) as PaymentLinkRequest;
  const amount =
    typeof body.amount === "number" ? body.amount : Number(body.amount);
  const currency =
    typeof body.currency === "string" ? body.currency.toUpperCase() : "INR";
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : "Payment";

  if (!Number.isInteger(amount) || amount <= 0) {
    return errorResponse(
      res,
      "amount must be a positive integer in the smallest currency unit.",
      400,
    );
  }

  if (!supportedCurrencies.has(currency)) {
    return errorResponse(
      res,
      `currency must be one of ${Array.from(supportedCurrencies).join(", ")}.`,
      400,
    );
  }

  const customer = body.customer ?? {};
  const customerPayload = {
    ...(typeof customer.name === "string" && customer.name.trim()
      ? { name: customer.name.trim() }
      : {}),
    ...(typeof customer.email === "string" && customer.email.trim()
      ? { email: customer.email.trim() }
      : {}),
    ...(typeof customer.contact === "string" && customer.contact.trim()
      ? { contact: customer.contact.trim() }
      : {}),
  };

  const payload = {
    amount,
    currency,
    accept_partial: false,
    description,
    ...(Object.keys(customerPayload).length > 0
      ? { customer: customerPayload }
      : {}),
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    ...(body.notes ? { notes: body.notes } : {}),
  };

  if (!keyId?.trim() || !keySecret?.trim()) {
    logger.warn("Razorpay credentials are missing; using a demo payment link");
    return createDemoPaymentLinkResponse(res, {
      amount,
      currency,
      description,
      customer: customerPayload,
      notes: body.notes,
    });
  }

  try {
    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      // Keep the provider response empty so the status code can still drive fallback behavior.
    }

    if (!response.ok) {
      const providerError =
        typeof result.error === "object" &&
        result.error !== null &&
        "description" in result.error &&
        typeof result.error.description === "string"
          ? result.error.description
          : "Razorpay rejected the payment-link request.";

      if (isAuthenticationError(response.status, providerError)) {
        logger.warn("Razorpay authentication failed; using a demo payment link");
        return createDemoPaymentLinkResponse(res, {
          amount,
          currency,
          description,
          customer: customerPayload,
          notes: body.notes,
        });
      }

      return errorResponse(res, providerError, response.status);
    }

    if (typeof result.id !== "string") {
      return errorResponse(
        res,
        "Razorpay returned an invalid payment-link response.",
        502,
      );
    }

    const persisted = await persistCreatedPaymentLink({
      razorpayId: result.id,
      shortUrl: typeof result.short_url === "string" ? result.short_url : undefined,
      providerStatus:
        typeof result.status === "string" ? result.status : undefined,
      amount,
      currency,
      description,
      customerName:
        typeof customerPayload.name === "string"
          ? customerPayload.name
          : undefined,
      customerEmail:
        typeof customerPayload.email === "string"
          ? customerPayload.email
          : undefined,
      customerContact:
        typeof customerPayload.contact === "string"
          ? customerPayload.contact
          : undefined,
      notes: body.notes,
    });

    return res.json({
      id: result.id,
      short_url: result.short_url,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      created_at: result.created_at,
      order_id: persisted.transaction.orderId,
      transaction_id: persisted.transaction.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isAuthenticationError(undefined, message)) {
      logger.warn("Razorpay authentication threw an error; using a demo payment link");
      return createDemoPaymentLinkResponse(res, {
        amount,
        currency,
        description,
        customer: customerPayload,
        notes: body.notes,
      });
    }

    logger.error({ err: error }, "Payment-link persistence request failed");
    return errorResponse(
      res,
      "Unable to create and save the payment link. Please try again shortly.",
      502,
    );
  }
});

export default router;
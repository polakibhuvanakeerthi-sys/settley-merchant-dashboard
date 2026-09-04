import { Router, type IRouter, type Response } from "express";
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

router.post("/create-payment-link", async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return errorResponse(
      res,
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the environment.",
      503,
    );
  }

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

  try {
    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const providerError =
        typeof result.error === "object" &&
        result.error !== null &&
        "description" in result.error &&
        typeof result.error.description === "string"
          ? result.error.description
          : "Razorpay rejected the payment-link request.";

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
    logger.error({ err: error }, "Payment-link persistence request failed");
    return errorResponse(
      res,
      "Unable to create and save the payment link. Please try again shortly.",
      502,
    );
  }
});

export default router;
import { Router, type IRouter } from "express";
import {
  markRazorpayPaymentCaptured,
  verifyRazorpayWebhookSignature,
} from "@workspace/db/prisma";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : "";
  const signature = req.header("x-razorpay-signature");
  const verification = verifyRazorpayWebhookSignature(rawBody, signature);

  if (!verification.configured) {
    return res.status(503).json({
      error: "Razorpay webhook verification is not configured.",
    });
  }

  if (!verification.valid) {
    return res.status(401).json({ error: "Invalid Razorpay webhook signature." });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return res.status(400).json({ error: "Webhook body must be valid JSON." });
  }

  if (payload.event !== "payment.captured") {
    return res.json({ received: true, processed: false });
  }

  const payment = (
    (payload.payload as Record<string, unknown> | undefined)?.payment as
      | Record<string, unknown>
      | undefined
  )?.entity as Record<string, unknown> | undefined;
  const paymentId = typeof payment?.id === "string" ? payment.id : undefined;
  const paymentLinkId =
    typeof payment?.payment_link_id === "string"
      ? payment.payment_link_id
      : undefined;

  if (!paymentId) {
    return res.status(400).json({
      error: "payment.captured webhook is missing payment.entity.id.",
    });
  }

  try {
    const transaction = await markRazorpayPaymentCaptured({
      paymentId,
      paymentLinkId,
    });

    return res.json({
      received: true,
      processed: Boolean(transaction),
      order_id: transaction?.orderId ?? null,
      status: transaction?.status ?? null,
    });
  } catch (error) {
    logger.error({ err: error, paymentId }, "Razorpay webhook processing failed");
    return res.status(500).json({ error: "Unable to process webhook." });
  }
});

export default router;
import { NextResponse } from "next/server";
import {
  markRazorpayPaymentCaptured,
  verifyRazorpayWebhookSignature,
} from "@workspace/db/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = verifyRazorpayWebhookSignature(
    rawBody,
    request.headers.get("x-razorpay-signature"),
  );

  if (!verification.configured) {
    return NextResponse.json(
      { error: "Razorpay webhook verification is not configured." },
      { status: 503 },
    );
  }

  if (!verification.valid) {
    return NextResponse.json(
      { error: "Invalid Razorpay webhook signature." },
      { status: 401 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Webhook body must be valid JSON." },
      { status: 400 },
    );
  }

  if (payload.event !== "payment.captured") {
    return NextResponse.json({ received: true, processed: false });
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
    return NextResponse.json(
      { error: "payment.captured webhook is missing payment.entity.id." },
      { status: 400 },
    );
  }

  try {
    const transaction = await markRazorpayPaymentCaptured({
      paymentId,
      paymentLinkId,
    });

    return NextResponse.json({
      received: true,
      processed: Boolean(transaction),
      order_id: transaction?.orderId ?? null,
      status: transaction?.status ?? null,
    });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    return NextResponse.json(
      { error: "Unable to process webhook." },
      { status: 500 },
    );
  }
}
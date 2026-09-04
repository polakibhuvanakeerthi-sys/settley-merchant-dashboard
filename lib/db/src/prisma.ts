import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  PrismaClient,
  TransactionStatus,
  type Prisma,
} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const DEFAULT_USER_EMAIL = "merchant@settley.local";
const DEFAULT_MERCHANT_SLUG = "settley-demo";

export async function getDefaultMerchant() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: "Settley Merchant" },
    create: {
      email: DEFAULT_USER_EMAIL,
      name: "Settley Merchant",
    },
  });

  return prisma.merchant.upsert({
    where: { slug: DEFAULT_MERCHANT_SLUG },
    update: { name: "Settley Demo Merchant", userId: user.id },
    create: {
      name: "Settley Demo Merchant",
      slug: DEFAULT_MERCHANT_SLUG,
      userId: user.id,
    },
  });
}

export type PersistPaymentLinkInput = {
  razorpayId: string;
  shortUrl?: string;
  providerStatus?: string;
  amount: number;
  currency: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  notes?: Record<string, string>;
};

export async function persistCreatedPaymentLink(input: PersistPaymentLinkInput) {
  const merchant = await getDefaultMerchant();
  const orderId = `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;

  return prisma.$transaction(async (transaction) => {
    const createdTransaction = await transaction.transaction.create({
      data: {
        orderId,
        merchantId: merchant.id,
        customerName: input.customerName || "Payment customer",
        customerPhone: input.customerContact,
        customerEmail: input.customerEmail,
        amount: input.amount,
        currency: input.currency,
        status: TransactionStatus.PENDING,
        method: "Razorpay Link",
      },
    });

    const paymentLink = await transaction.paymentLink.create({
      data: {
        razorpayId: input.razorpayId,
        shortUrl: input.shortUrl,
        merchantId: merchant.id,
        transactionId: createdTransaction.id,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        status: input.providerStatus,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerContact: input.customerContact,
        notes: input.notes as Prisma.InputJsonValue | undefined,
      },
    });

    return { transaction: createdTransaction, paymentLink };
  });
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return { configured: false, valid: false };
  }

  if (!signature) {
    return { configured: true, valid: false };
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  const valid =
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer);

  return { configured: true, valid };
}

export async function markRazorpayPaymentCaptured(input: {
  paymentId: string;
  paymentLinkId?: string;
}) {
  const conditions: Prisma.TransactionWhereInput[] = [
    { razorpayPaymentId: input.paymentId },
  ];

  if (input.paymentLinkId) {
    conditions.push({
      paymentLink: { is: { razorpayId: input.paymentLinkId } },
    });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { OR: conditions },
    include: { paymentLink: true },
  });

  if (!transaction) {
    return null;
  }

  return prisma.$transaction(async (database) => {
    const updatedTransaction = await database.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.COMPLETED,
        razorpayPaymentId: input.paymentId,
      },
    });

    if (transaction.paymentLink) {
      await database.paymentLink.update({
        where: { id: transaction.paymentLink.id },
        data: { status: "paid" },
      });
    }

    return updatedTransaction;
  });
}
import { NextResponse } from 'next/server';

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

const supportedCurrencies = new Set(['INR', 'USD', 'EUR', 'GBP']);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return errorResponse(
      'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the environment.',
      503,
    );
  }

  let body: PaymentLinkRequest;
  try {
    body = (await request.json()) as PaymentLinkRequest;
  } catch {
    return errorResponse('Request body must be valid JSON.', 400);
  }

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
  const currency =
    typeof body.currency === 'string' ? body.currency.toUpperCase() : 'INR';
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : 'Payment';

  if (!Number.isInteger(amount) || amount <= 0) {
    return errorResponse(
      'amount must be a positive integer in the smallest currency unit.',
      400,
    );
  }

  if (!supportedCurrencies.has(currency)) {
    return errorResponse(
      `currency must be one of ${Array.from(supportedCurrencies).join(', ')}.`,
      400,
    );
  }

  const customer = body.customer ?? {};
  const customerPayload = {
    ...(typeof customer.name === 'string' && customer.name.trim()
      ? { name: customer.name.trim() }
      : {}),
    ...(typeof customer.email === 'string' && customer.email.trim()
      ? { email: customer.email.trim() }
      : {}),
    ...(typeof customer.contact === 'string' && customer.contact.trim()
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
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const providerError =
        typeof result.error === 'object' &&
        result.error !== null &&
        'description' in result.error &&
        typeof result.error.description === 'string'
          ? result.error.description
          : 'Razorpay rejected the payment-link request.';

      return errorResponse(providerError, response.status);
    }

    return NextResponse.json({
      id: result.id,
      short_url: result.short_url,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      created_at: result.created_at,
    });
  } catch (error) {
    console.error('Razorpay payment-link request failed', error);
    return errorResponse(
      'Unable to reach Razorpay. Please try again shortly.',
      502,
    );
  }
}
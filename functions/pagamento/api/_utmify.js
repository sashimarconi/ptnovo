const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

export function assertUtmifyConfig(env) {
  if (!env.UTMIFY_API_TOKEN) {
    throw new Error("Configuração Utmify incompleta: 'UTMIFY_API_TOKEN' em falta.");
  }
}

export function formatUtcDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function buildUtmifyPayload(env, input) {
  const amount = Number(input.amount ?? 0);
  const amountInCents = Math.round(amount * 100);
  const customer = {
    name: input.customer?.name || env.UTMIFY_CUSTOMER_NAME || "Cliente Utmify",
    email: input.customer?.email || env.UTMIFY_CUSTOMER_EMAIL || "cliente@utmify.local",
    phone: input.customer?.phone ?? null,
    document: input.customer?.document ?? null,
    country: input.customer?.country ?? env.UTMIFY_CUSTOMER_COUNTRY ?? null,
    ip: input.customer?.ip ?? null,
  };

  return {
    orderId: String(input.orderId),
    platform: env.UTMIFY_PLATFORM || "GlobalPay",
    paymentMethod: input.paymentMethod || "pix",
    status: input.status,
    createdAt: input.createdAt || formatUtcDate(),
    approvedDate: input.approvedDate ?? null,
    refundedAt: input.refundedAt ?? null,
    customer,
    products: input.products || [
      {
        id: String(input.orderId),
        name: env.UTMIFY_PRODUCT_NAME || "Pedido WayMB",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: amountInCents,
      },
    ],
    trackingParameters: {
      src: input.trackingParameters?.src ?? null,
      sck: input.trackingParameters?.sck ?? null,
      utm_source: input.trackingParameters?.utm_source ?? null,
      utm_campaign: input.trackingParameters?.utm_campaign ?? null,
      utm_medium: input.trackingParameters?.utm_medium ?? null,
      utm_content: input.trackingParameters?.utm_content ?? null,
      utm_term: input.trackingParameters?.utm_term ?? null,
    },
    commission: input.commission || {
      totalPriceInCents: amountInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: amountInCents,
      currency: env.UTMIFY_CURRENCY || "BRL",
    },
    isTest: false,
  };
}

export async function sendUtmifyOrder(env, input) {
  assertUtmifyConfig(env);
  const payload = buildUtmifyPayload(env, input);

  const response = await fetch(UTMIFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": env.UTMIFY_API_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta Utmify inválida (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const error = data?.error || data?.message || `HTTP ${response.status}`;
    throw new Error(`Utmify recusou o pedido: ${error}`);
  }

  return data;
}

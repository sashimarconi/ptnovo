import { assertConfig, jsonResponse, waymbRequest } from "./_waymb.js";
import { assertUtmifyConfig, sendUtmifyOrder, formatUtcDate } from "./_utmify.js";

function normalizeString(value) {
  return String(value ?? "").trim().toLowerCase();
}

function waymbStatusToUtmify(raw) {
  const status = normalizeString(raw);
  if (!status) return null;
  if (status.includes("paid") || status.includes("completed") || status.includes("approved") || status.includes("success")) {
    return "paid";
  }
  if (status.includes("pending") || status.includes("waiting") || status.includes("created")) {
    return "waiting_payment";
  }
  if (status.includes("declined") || status.includes("refused") || status.includes("rejected") || status.includes("cancel")) {
    return "refused";
  }
  if (status.includes("refund")) return "refunded";
  if (status.includes("chargeback")) return "chargedback";
  return null;
}

function waymbMethodToUtmify(raw) {
  const method = normalizeString(raw);
  if (method === "mbway" || method === "pix") return "pix";
  if (method === "multibanco" || method === "boleto") return "boleto";
  return "free_price";
}

async function parseRequestBody(request) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      return await request.json();
    }
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      return Object.fromEntries(form.entries());
    }
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function onRequestPost({ request, env }) {
  const body = await parseRequestBody(request);
  const transactionID = body.transactionID || body.id || body.txId || body.data?.transactionID || body.data?.id || body.transaction?.id;
  const statusRaw = body.status || body.transactionStatus || body.statusCode || body.data?.status || body.transaction?.status;
  const status = waymbStatusToUtmify(statusRaw);
  if (!transactionID || status !== "paid") {
    return jsonResponse({ ok: true });
  }

  try {
    assertConfig(env);
    assertUtmifyConfig(env);

    const info = await waymbRequest("/transactions/info", {
      client_id:     env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      account_email: env.ACCOUNT_EMAIL,
      transactionID,
    });

    const paymentMethod = waymbMethodToUtmify(info.method || info.paymentMethod || info.payment_method || info.transaction?.method);
    const amount = Number(info.amount ?? info.value ?? 0);
    const createdAt = info.createdAt || info.created_at || formatUtcDate();
    const approvedDate = formatUtcDate();

    await sendUtmifyOrder(env, {
      orderId: transactionID,
      paymentMethod,
      status,
      amount,
      createdAt,
      approvedDate,
      trackingParameters: {},
    });
  } catch (err) {
    console.error("Utmify webhook error:", err?.message || err);
  }

  return jsonResponse({ ok: true });
}

import { assertConfig, waymbRequest } from "../../functions/pagamento/api/_waymb.js";
import { assertUtmifyConfig, sendUtmifyOrder, formatUtcDate } from "../../functions/pagamento/api/_utmify.js";

function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

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

async function parseRequestBody(req) {
  const contentType = (req.headers["content-type"] || "").toString().toLowerCase();
  const bodyText = await new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });

  if (contentType.includes("application/json")) {
    try { return JSON.parse(bodyText || "{}"); } catch { return {}; }
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("text/plain")) {
    return Object.fromEntries(new URLSearchParams(bodyText));
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, { error: "Method not allowed." }, 405);
  }

  const body = await parseRequestBody(req);
  const transactionID = body.transactionID || body.id || body.txId || body.data?.transactionID || body.data?.id || body.transaction?.id;
  const statusRaw = body.status || body.transactionStatus || body.statusCode || body.data?.status || body.transaction?.status;
  const status = waymbStatusToUtmify(statusRaw);

  if (!transactionID || status !== "paid") {
    return sendJson(res, { ok: true });
  }

  try {
    assertConfig(process.env);
    assertUtmifyConfig(process.env);

    const info = await waymbRequest("/transactions/info", {
      client_id:     process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      account_email: process.env.ACCOUNT_EMAIL,
      transactionID,
    });

    const paymentMethod = waymbMethodToUtmify(info.method || info.paymentMethod || info.payment_method || info.transaction?.method);
    const amount = Number(info.amount ?? info.value ?? 0);
    const createdAt = info.createdAt || info.created_at || formatUtcDate();
    const approvedDate = formatUtcDate();

    await sendUtmifyOrder(process.env, {
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

  return sendJson(res, { ok: true });
}

import { assertConfig, basePayload, callbackUrlFor, waymbRequest } from "../../functions/pagamento/api/_waymb.js";
import { sendUtmifyOrder, formatUtcDate } from "../../functions/pagamento/api/_utmify.js";

function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function mapPaymentMethod(method) {
  if (method === "mbway") return "pix";
  if (method === "multibanco") return "boleto";
  return "free_price";
}

function parseTrackingParameters(req) {
  const referer = req.headers["referer"] || req.headers["referrer"] || "";
  if (!referer) return {};
  try {
    const url = new URL(referer);
    const params = url.searchParams;
    return {
      src: params.get("src") ?? null,
      sck: params.get("sck") ?? null,
      utm_source: params.get("utm_source") ?? null,
      utm_campaign: params.get("utm_campaign") ?? null,
      utm_medium: params.get("utm_medium") ?? null,
      utm_content: params.get("utm_content") ?? null,
      utm_term: params.get("utm_term") ?? null,
    };
  } catch {
    return {};
  }
}

async function parseBody(req) {
  const contentType = (req.headers["content-type"] || "").toString();
  if (contentType.includes("application/json")) {
    return req.body ?? {};
  }

  const body = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("text/plain")) {
    return Object.fromEntries(new URLSearchParams(body));
  }

  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, { error: "Method not allowed." }, 405);
  }

  let method;
  let phone;
  let amount;

  try {
    const body = await parseBody(req);
    method = body.method;
    phone = (body.phone ?? "").toString().trim();
    amount = (body.amount ?? "").toString().trim();
  } catch {
    return sendJson(res, { error: "Pedido inválido." }, 400);
  }

  if (!["mbway", "multibanco"].includes(method)) {
    return sendJson(res, { error: "Método inválido." }, 400);
  }
  if (method === "mbway" && !phone) {
    return sendJson(res, { error: "Indique o seu número de telemóvel MB Way." }, 400);
  }

  if (amount) {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return sendJson(res, { error: "Valor de pagamento inválido." }, 400);
    }
    amount = parsedAmount;
  } else {
    amount = null;
  }

  try {
    assertConfig(process.env);
    const payload = basePayload(process.env, method, callbackUrlFor(process.env), amount);
    if (method === "mbway") payload.payer.phone = phone;

    const response = await waymbRequest("/transactions/create", payload);
    const txId = response.transactionID || response.id;
    if (!txId) throw new Error("Resposta WayMB sem transactionID.");

    const out = {
      transactionID: txId,
      method,
      amount: payload.amount,
      currency: payload.currency,
    };
    if (method === "multibanco" && response.referenceData) out.reference = response.referenceData;
    if (method === "mbway") out.mbway = response.generatedMBWay ?? null;

    if (process.env.UTMIFY_API_TOKEN) {
      const utmifyPayload = {
        orderId: txId,
        paymentMethod: mapPaymentMethod(method),
        status: "waiting_payment",
        amount: payload.amount,
        createdAt: formatUtcDate(),
        approvedDate: null,
        trackingParameters: parseTrackingParameters(req),
      };
      try {
        await sendUtmifyOrder(process.env, utmifyPayload);
      } catch (err) {
        console.error("Utmify create error:", err?.message || err);
      }
    }

    return sendJson(res, out);
  } catch (err) {
    return sendJson(res, { error: err.message }, 502);
  }
}

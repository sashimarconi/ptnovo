// POST /pagamento/api/criar
// Body: form-encoded ou JSON com { method: 'mbway'|'multibanco', phone?: string }

import { assertConfig, basePayload, callbackUrlFor, jsonResponse, waymbRequest } from "./_waymb.js";
import { sendUtmifyOrder, formatUtcDate } from "./_utmify.js";

function mapPaymentMethod(method) {
  if (method === "mbway") return "pix";
  if (method === "multibanco") return "boleto";
  return "free_price";
}

function parseTrackingParameters(request) {
  const referer = request.headers.get("referer") || request.headers.get("referrer") || "";
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

export async function onRequestPost({ request, env }) {
  let method, phone, amount;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      method = body.method;
      phone  = (body.phone ?? "").toString().trim();
      amount = (body.amount ?? "").toString().trim();
    } else {
      const form = await request.formData();
      method = form.get("method");
      phone  = (form.get("phone") ?? "").toString().trim();
      amount = (form.get("amount") ?? "").toString().trim();
    }
  } catch {
    return jsonResponse({ error: "Pedido inválido." }, 400);
  }

  if (!["mbway", "multibanco"].includes(method)) {
    return jsonResponse({ error: "Método inválido." }, 400);
  }
  if (method === "mbway" && !phone) {
    return jsonResponse({ error: "Indique o seu número de telemóvel MB Way." }, 400);
  }

  if (amount) {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return jsonResponse({ error: "Valor de pagamento inválido." }, 400);
    }
    amount = parsedAmount;
  } else {
    amount = null;
  }

  try {
    assertConfig(env);
    const payload = basePayload(env, method, callbackUrlFor(env), amount);
    if (method === "mbway") payload.payer.phone = phone;

    const response = await waymbRequest("/transactions/create", payload);
    const txId = response.transactionID || response.id;
    if (!txId) throw new Error("Resposta WayMB sem transactionID.");

    const out = {
      transactionID: txId,
      method,
      amount:   payload.amount,
      currency: payload.currency,
    };
    if (method === "multibanco" && response.referenceData) out.reference = response.referenceData;
    if (method === "mbway") out.mbway = response.generatedMBWay ?? null;

    if (env.UTMIFY_API_TOKEN) {
      const utmifyPayload = {
        orderId: txId,
        paymentMethod: mapPaymentMethod(method),
        status: "waiting_payment",
        amount: payload.amount,
        createdAt: formatUtcDate(),
        approvedDate: null,
        trackingParameters: parseTrackingParameters(request),
      };
      try {
        await sendUtmifyOrder(env, utmifyPayload);
      } catch (err) {
        console.error("Utmify create error:", err?.message || err);
      }
    }

    return jsonResponse(out);
  } catch (err) {
    return jsonResponse({ error: err.message }, 502);
  }
}

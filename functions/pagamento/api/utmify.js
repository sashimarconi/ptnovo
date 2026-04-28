import { jsonResponse, sendUtmifyOrder, formatUtcDate } from "./_utmify.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    return jsonResponse({ error: "Pedido inválido." }, 400);
  }

  const orderId = (body.orderId ?? "").toString().trim();
  const status = (body.status ?? "").toString().trim();
  const method = (body.method ?? "").toString().trim();
  const amount = parseFloat((body.amount ?? "0").toString().replace(",", "."));

  if (!orderId) return jsonResponse({ error: "orderId em falta." }, 400);
  if (!status) return jsonResponse({ error: "status em falta." }, 400);
  if (!method) return jsonResponse({ error: "method em falta." }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return jsonResponse({ error: "amount inválido." }, 400);

  const trackingParameters = {
    src: body.src ?? null,
    sck: body.sck ?? null,
    utm_source: body.utm_source ?? null,
    utm_campaign: body.utm_campaign ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_content: body.utm_content ?? null,
    utm_term: body.utm_term ?? null,
  };

  try {
    const payload = {
      orderId,
      paymentMethod: method,
      status,
      amount,
      createdAt: body.createdAt ?? formatUtcDate(),
      approvedDate: body.approvedDate ?? (status === "paid" ? formatUtcDate() : null),
      refundedAt: body.refundedAt ?? null,
      trackingParameters,
    };

    await sendUtmifyOrder(env, payload);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message }, 502);
  }
}

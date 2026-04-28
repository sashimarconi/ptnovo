// GET /pagamento/api/status?id=<transactionID>
// Consulta o estado diretamente à WayMB (stateless — sem cache local).

import { assertConfig, jsonResponse, waymbRequest } from "./_waymb.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id  = (url.searchParams.get("id") || "").trim();
  if (!id) return jsonResponse({ error: "id em falta." }, 400);

  try {
    assertConfig(env);
    const info = await waymbRequest("/transactions/info", {
      client_id:     env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      account_email: env.ACCOUNT_EMAIL,
      transactionID: id,
    });

    const remote = (info.status || "PENDING").toString().toUpperCase();
    const status = ["PENDING", "COMPLETED", "DECLINED"].includes(remote) ? remote : "PENDING";

    return jsonResponse({ transactionID: id, status });
  } catch (err) {
    return jsonResponse({ error: err.message }, 502);
  }
}

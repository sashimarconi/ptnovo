// Helper partilhado para as Pages Functions chamarem a API WayMB.
// Todas as credenciais vêm de env (Cloudflare Pages → Settings → Variables and Secrets).

const WAYMB_BASE = "https://api.waymb.com";

export function assertConfig(env) {
  for (const key of ["CLIENT_ID", "CLIENT_SECRET", "ACCOUNT_EMAIL"]) {
    if (!env[key]) throw new Error(`Configuração WayMB incompleta: '${key}' em falta.`);
  }
}

export function basePayload(env, method, callbackUrl, amount) {
  return {
    client_id:          env.CLIENT_ID,
    client_secret:      env.CLIENT_SECRET,
    account_email:      env.ACCOUNT_EMAIL,
    amount:             parseFloat(String(amount ?? env.AMOUNT || "20.19")),
    currency:           env.CURRENCY || "EUR",
    method,
    paymentDescription: (env.DESCRIPTION || "Taxa de Registo TikTok Rewards").slice(0, 50),
    callbackUrl,
    payer: {
      name:     env.DEFAULT_NAME  || "Participante TikTok Rewards",
      email:    env.DEFAULT_EMAIL || "participante@tiktokrewards.pt",
      document: env.DEFAULT_DOC   || "000000000",
      phone:    "",
    },
  };
}

export async function waymbRequest(endpoint, payload) {
  let response, body;
  try {
    response = await fetch(WAYMB_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    body = await response.text();
  } catch (err) {
    throw new Error(`Erro de rede WayMB: ${err.message}`);
  }

  let data;
  try { data = JSON.parse(body); } catch {
    throw new Error(`Resposta WayMB inválida (HTTP ${response.status}).`);
  }

  if (!response.ok || data?.success === false) {
    const msg = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(`WayMB recusou o pedido: ${msg}`);
  }

  return data;
}

export function callbackUrlFor(env) {
  const base = (env.SITE_BASE || "").replace(/\/$/, "");
  return `${base}/pagamento/api/webhook`;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

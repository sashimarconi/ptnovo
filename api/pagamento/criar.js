import { assertConfig, basePayload, callbackUrlFor, waymbRequest } from "../../functions/pagamento/api/_waymb.js";

function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
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

  try {
    const body = await parseBody(req);
    method = body.method;
    phone = (body.phone ?? "").toString().trim();
  } catch {
    return sendJson(res, { error: "Pedido inválido." }, 400);
  }

  if (!["mbway", "multibanco"].includes(method)) {
    return sendJson(res, { error: "Método inválido." }, 400);
  }
  if (method === "mbway" && !phone) {
    return sendJson(res, { error: "Indique o seu número de telemóvel MB Way." }, 400);
  }

  try {
    assertConfig(process.env);
    const payload = basePayload(process.env, method, callbackUrlFor(process.env));
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

    return sendJson(res, out);
  } catch (err) {
    return sendJson(res, { error: err.message }, 502);
  }
}

import { assertConfig, waymbRequest } from "../../functions/pagamento/api/_waymb.js";

function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, { error: "Method not allowed." }, 405);
  }

  const origin = `http://${req.headers.host || "localhost"}`;
  const url = new URL(req.url || "", origin);
  const id = (url.searchParams.get("id") || "").trim();
  if (!id) return sendJson(res, { error: "id em falta." }, 400);

  try {
    assertConfig(process.env);
    const info = await waymbRequest("/transactions/info", {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      account_email: process.env.ACCOUNT_EMAIL,
      transactionID: id,
    });

    const remote = (info.status || "PENDING").toString().toUpperCase();
    const status = ["PENDING", "COMPLETED", "DECLINED"].includes(remote) ? remote : "PENDING";
    return sendJson(res, { transactionID: id, status });
  } catch (err) {
    return sendJson(res, { error: err.message }, 502);
  }
}

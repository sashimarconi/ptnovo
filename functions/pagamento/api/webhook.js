// POST /pagamento/api/webhook
// Endpoint chamado pela WayMB com atualizações de estado.
// Aqui é no-op: o estado é sempre lido on-demand em /api/status. Este endpoint existe
// apenas para satisfazer a configuração de webhook obrigatória no painel WayMB.

export async function onRequestPost({ request }) {
  // Lê e descarta o body para confirmar receção (debug futuro pode logar em console).
  try { await request.text(); } catch { /* ignorado */ }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

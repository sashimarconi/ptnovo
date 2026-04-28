# Projeto TikTok Rewards

Este projeto está preparado para deploy estático com APIs na Vercel.

## Deploy na Vercel

1. Coloque o projeto no GitHub em `https://github.com/sashimarconi/ptnovo`.
2. Conecte o repositório no Vercel.
3. Não é necessário comando de build.
4. Defina a pasta de saída como `/`.

## Variáveis de ambiente (Vercel)

Defina estas variáveis no painel do Vercel:

- `CLIENT_ID`
- `CLIENT_SECRET`
- `ACCOUNT_EMAIL`
- `AMOUNT` = `20.19`
- `SITE_BASE` = `https://<seu-projeto>.vercel.app`

## Como funciona

- `pagamento/index.html` chama `./api/criar` e `./api/status`
- `vercel.json` reescreve `/pagamento/api/*` para `/api/pagamento/*`
- O backend usa WayMB via `functions/pagamento/api/_waymb.js`

> Para usar outra conta WayMB, apenas atualize `CLIENT_ID`, `CLIENT_SECRET` e `ACCOUNT_EMAIL` no Vercel.

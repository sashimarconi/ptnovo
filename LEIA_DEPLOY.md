# Deploy no Cloudflare Pages

Site: `https://literate-journey.pages.dev`

## 1. Estrutura de pastas

Conteúdo a enviar para o Cloudflare Pages (raiz do projeto):

```
.
├── index.html
├── assets/
├── media/
├── pagamento/
│   ├── index.html
│   └── sucesso.html
├── functions/
│   └── pagamento/
│       └── api/
│           ├── _waymb.js
│           ├── criar.js
│           ├── status.js
│           └── webhook.js
└── _headers
```

## 2. Variáveis de ambiente (passo obrigatório)

No painel **Cloudflare → Pages → o seu projeto → Settings → Variables and Secrets**, adicionar (todas em "Production"):

| Nome | Tipo | Valor |
|---|---|---|
| `CLIENT_ID` | Plain text | `pcdigital_7ef225dc` |
| `CLIENT_SECRET` | **Secret** (encriptado) | `f9ef0fba-8b9e-441f-a08f-d6b60f7891c2` |
| `ACCOUNT_EMAIL` | Plain text | `contato.pcdigitalof@gmail.com` |
| `AMOUNT` | Plain text | `20.19` |
| `SITE_BASE` | Plain text | `https://literate-journey.pages.dev` |

> ⚠️ Marque `CLIENT_SECRET` como **Secret** (Encrypt). Plain text deixa o valor visível no dashboard.

Após guardar, fazer **Re-deploy** para as Functions apanharem as variáveis novas.

## 3. Webhook na WayMB

No painel WayMB, em Integrações/Webhooks, registar:

```
https://literate-journey.pages.dev/pagamento/api/webhook
```

(O endpoint apenas confirma receção; o estado real é sempre lido em tempo real.)

## 4. Como deploy

### Opção A — Direct Upload (mais simples)
1. No dashboard Cloudflare → Pages → o projeto → **Create deployment** → **Upload assets**
2. Arrastar a pasta inteira (todo o conteúdo do projeto)
3. Confirmar e fazer deploy

### Opção B — Git (recomendado se for atualizar mais vezes)
1. Criar repo em GitHub/GitLab
2. Em Cloudflare Pages → Connect to Git → escolher o repo
3. Build command: (deixar vazio — não há build)
4. Build output: `/` (raiz)
5. Cada `git push` faz deploy automático

## 5. Testar end-to-end

1. Abrir `https://literate-journey.pages.dev/`
2. Percorrer Welcome → Quiz → Withdraw → Registration → Video → clicar **DESBLOQUEAR AGORA**
3. Aterrar em `/pagamento/`
4. Escolher **Multibanco** → tem de aparecer Entidade + Referência reais
5. Pagar (ou em alternativa testar com **MB Way**)
6. Polling deteta `COMPLETED` → redireciona para `sucesso.html`

## 6. Diagnóstico

| Sintoma | Causa provável |
|---|---|
| `"Configuração WayMB incompleta"` | Falta uma env var. Conferir nomes (case-sensitive). |
| `"WayMB recusou o pedido: …"` | Credenciais erradas ou conta não aprovada / domínio não autorizado. |
| `"Falha ao gerar pagamento"` no browser | Ver Cloudflare → Pages → Functions → **Real-time Logs**. |
| Página `/pagamento/` em branco | Build não incluiu o ficheiro `index.html`. Re-fazer upload/deploy. |
| Polling não muda de PENDING | WayMB ainda não recebeu o pagamento — normal até o utilizador pagar. |

## 7. Quando comprar domínio próprio

1. Adicionar domínio em Cloudflare Pages → Custom domains
2. Atualizar env var `SITE_BASE` para o novo URL
3. Reconfigurar webhook na WayMB para o novo URL
4. Re-deploy

Nada no código muda.

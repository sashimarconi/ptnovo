# Documentação da API para envio de vendas - Utmify

## 1 - Formato da Requisição

Para enviar uma requisição à nossa API, será necessário criar uma credencial de API, que será utilizada nos headers desta requisição. Para obter uma credencial, basta acessar (ou criar) a sua conta gratuita na Utmify e seguir o caminho:

Integrações > Webhooks > Credenciais de API > Adicionar Credencial > Criar Credencial.

### 1.1 - Endpoint

Para enviar as informações dos pedidos, devem ser enviadas requisições do tipo `POST` para o seguinte endpoint:

`https://api.utmify.com.br/api-credentials/orders`

### 1.2 - Headers

Nos headers da requisição deve ser informada a credencial de API gerada no seguinte formato:

```json
{
  "x-api-token": "string"
}
```

### 1.3 - Payload

O body da requisição deve seguir o formato abaixo:

#### 1.3.1 - Body

```json
{
  "orderId": "string",
  "platform": "string",
  "paymentMethod": "credit_card" | "boleto" | "pix" | "paypal" | "free_price",
  "status": "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback",
  "createdAt": "YYYY-MM-DD HH:MM:SS",
  "approvedDate": "YYYY-MM-DD HH:MM:SS" | null,
  "refundedAt": "YYYY-MM-DD HH:MM:SS" | null,
  "customer": Customer,
  "products": Product[],
  "trackingParameters": TrackingParameters,
  "commission": Commission,
  "isTest": boolean
}
```

#### 1.3.2 - Customer

```json
{
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "document": "string | null",
  "country": "string",
  "ip": "string"
}
```

- `country` opcional: ISO 3166-1 alfa-2
- `ip` opcional

#### 1.3.3 - Product

```json
{
  "id": "string",
  "name": "string",
  "planId": "string | null",
  "planName": "string | null",
  "quantity": number,
  "priceInCents": number
}
```

#### 1.3.4 - TrackingParameters

```json
{
  "src": "string | null",
  "sck": "string | null",
  "utm_source": "string | null",
  "utm_campaign": "string | null",
  "utm_medium": "string | null",
  "utm_content": "string | null",
  "utm_term": "string | null"
}
```

#### 1.3.5 - Commission

```json
{
  "totalPriceInCents": number,
  "gatewayFeeInCents": number,
  "userCommissionInCents": number,
  "currency": "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD" | "COP" | "MXN" | "PYG" | "CLP" | "PEN" | "PLN"
}
```

## 2 - Descrição dos Parâmetros

### 2.1 - Headers

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `x-api-token` | `KVRxalfMiBfm8Rm1nP5YxfwYzArNsA0VLeWC` | Credencial de API gerada no Dashboard da Utmify. Identifica o cliente e o dashboard que receberão o pedido. |

### 2.2 - Body

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `orderId` | `FC72D9AK9` | Identificação do pedido na plataforma de vendas. |
| `platform` | `GlobalPay` | Nome da plataforma que está integrando com a Utmify. Recomendado PascalCase. |
| `paymentMethod` | `credit_card` | Meio de pagamento utilizado na transação. |
| `status` | `paid` | Status do pagamento da transação. |
| `createdAt` | `2024-07-25 15:34:14` | Data em que o pedido foi criado (UTC). Deve ser mantido igual nas atualizações de status. |
| `approvedDate` | `2024-07-25 15:41:12` | Data em que o pagamento foi realizado (UTC). Use `null` se não pago. |
| `refundedAt` | `null` | Data em que o pedido foi reembolsado (UTC). Use `null` se não reembolsado. |
| `customer` | `Customer` | Informações do cliente. |
| `products` | `Product[]` | Lista de produtos na transação. |
| `trackingParameters` | `TrackingParameters` | Dados de tracking extraídos da URL do checkout. |
| `commission` | `Commission` | Valores da transação. |
| `isTest` | `false` | Marca a requisição como teste. Se `true`, validação ocorre, mas o pedido não é salvo. |

### 2.3 - Customer

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `name` | `Lucas Sampaio` | Nome do comprador. |
| `email` | `lusampa2020@gmail.com` | E-mail do comprador. |
| `phone` | `11991560063` | Telefone do comprador. |
| `document` | `43887057481` | CPF ou CNPJ do comprador. |
| `country` | `BR` | País do comprador no formato ISO 3166-1 alfa-2. Opcional. |
| `ip` | `204.97.192.73` | IP do comprador. Opcional, mas recomendado para melhor rastreamento. |

### 2.4 - Product

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `id` | `FGC1375Z5` | Identificação do produto. |
| `name` | `Calça` | Nome do produto. |
| `planId` | `FTS7743C3` | Id do plano, se existir. Caso não exista, enviar `null`. |
| `planName` | `Promoção de Natal` | Nome do plano, se existir. Caso não exista, enviar `null`. |
| `quantity` | `2` | Quantidade comprada. |
| `priceInCents` | `11990` | Preço do produto em centavos. |

### 2.5 - TrackingParameters

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `src` | `null` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `sck` | `null` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `utm_source` | `FB` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `utm_campaign` | `Vendas 2024/07/10|126351623512736523` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `utm_medium` | `ABO|1273612873681723` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `utm_content` | `VIDEO 01|2412937293769713` | Valor extraído da URL do checkout. Enviar `null` se não existir. |
| `utm_term` | `Instagram_Reels` | Valor extraído da URL do checkout. Enviar `null` se não existir. |

### 2.6 - Commission

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `totalPriceInCents` | `14990` | Valor total da transação, em centavos. |
| `gatewayFeeInCents` | `1500` | Valor cobrado pela plataforma, em centavos. |
| `userCommissionInCents` | `13490` | Valor recebido pelo vendedor, em centavos. Não pode ser zero, exceto quando o usuário não recebeu nada. |
| `currency` | `USD` | Moeda da compra. Se for BRL, não é obrigatório informar. |

## 3 - Exemplos Práticos de Requisições

### 3.1 - Pix Gerado e Pago

Um cliente realizou um pedido via pix na loja GlobalPay através do checkout com a URL:

`https://checkout.globalpay.com/11c4ca3b-4afa-487f-b92b-aeb2c9e86d3d?utm_source=FB&utm_campaign=CAMPANHA_2|413591587909524&utm_medium=CONJUNTO_2|498046723566488&utm_content=ANUNCIO_2|504346051220592&utm_term=Instagram_Feed`

O produto comprado foi um óleo de motor de R$ 80,00 com R$ 20,00 de frete. A plataforma cobra R$ 1,00 por pix pago + 3% do valor do pedido. O pix foi gerado em 26/07/2024 às 11:35:13 (horário de Brasília) e pago em 26/07/2024 às 11:43:37 (horário de Brasília).

A credencial de API do usuário da Utmify que realizou a venda é: `KVRxalfMiBfm8Rm1nP5YxfwYzArNsA0VLeWC`.

#### 3.1.1 - Pix Gerado

`POST https://api.utmify.com.br/api-credentials/orders`

Headers:

```json
{ "x-api-token": "KVRxalfMiBfm8Rm1nP5YxfwYzArNsA0VLeWC" }
```

Body:

```json
{
  "orderId": "8e40b27e-0118-4699-8587-e892beedb403",
  "platform": "GlobalPay",
  "paymentMethod": "pix",
  "status": "waiting_payment",
  "createdAt": "2024-07-26 14:35:13",
  "approvedDate": null,
  "refundedAt": null,
  "customer": {
    "name": "Marcos Goncalves Rodrigues",
    "email": "marcosgonrod@hotmail.com",
    "phone": "19936387209",
    "document": "29672656599",
    "country": "BR",
    "ip": "61.145.134.105"
  },
  "products": [
    {
      "id": "53d5ce96-a548-4c7b-a0bc-da8bfa0f9294",
      "name": "Óleo de Motor",
      "planId": null,
      "planName": null,
      "quantity": 1,
      "priceInCents": 8000
    }
  ],
  "trackingParameters": {
    "src": null,
    "sck": null,
    "utm_source": "FB",
    "utm_campaign": "CAMPANHA_2|413591587909524",
    "utm_medium": "CONJUNTO_2|498046723566488",
    "utm_content": "ANUNCIO_2|504346051220592",
    "utm_term": "Instagram_Feed"
  },
  "commission": {
    "totalPriceInCents": 10000,
    "gatewayFeeInCents": 400,
    "userCommissionInCents": 9600
  },
  "isTest": false
}
```

#### 3.1.2 - Pix Pago

`POST https://api.utmify.com.br/api-credentials/orders`

Headers:

```json
{ "x-api-token": "KVRxalfMiBfm8Rm1nP5YxfwYzArNsA0VLeWC" }
```

Body:

```json
{
  "orderId": "8e40b27e-0118-4699-8587-e892beedb403",
  "platform": "GlobalPay",
  "paymentMethod": "pix",
  "status": "paid",
  "createdAt": "2024-07-26 14:35:13",
  "approvedDate": "2024-07-26 14:43:37",
  "refundedAt": null,
  "customer": {
    "name": "Marcos Goncalves Rodrigues",
    "email": "marcosgonrod@hotmail.com",
    "phone": "19936387209",
    "document": "29672656599",
    "country": "BR",
    "ip": "61.145.134.105"
  },
  "products": [
    {
      "id": "53d5ce96-a548-4c7b-a0bc-da8bfa0f9294",
      "name": "Óleo de Motor",
      "planId": null,
      "planName": null,
      "quantity": 1,
      "priceInCents": 8000
    }
  ],
  "trackingParameters": {
    "src": null,
    "sck": null,
    "utm_source": "FB",
    "utm_campaign": "CAMPANHA_2|413591587909524",
    "utm_medium": "CONJUNTO_2|498046723566488",
    "utm_content": "ANUNCIO_2|504346051220592",
    "utm_term": "Instagram_Feed"
  },
  "commission": {
    "totalPriceInCents": 10000,
    "gatewayFeeInCents": 400,
    "userCommissionInCents": 9600
  },
  "isTest": false
}
```

### 3.2 - Cartão de Crédito Pago e Reembolsado

Um cliente realizou um pedido via cartão de crédito na data `15/07/2024 10:30:14` (horário de Brasília) e, insatisfeito, solicitou reembolso em `18/07/2024 22:44:39` (horário de Brasília).

O pedido foi realizado na plataforma GlobalPay em dólares, com os produtos:
- camiseta de $35.00
- calça de $40.00

A plataforma cobra 5% de taxa por pedido.

A URL do checkout era:

`https://checkout.globalpay.com/23a92775-718d-458f-a92b-6daa68188a?utm_source=FB&utm_campaign=CAMPANHA_5|761832537749495&utm_medium=CONJUNTO_5|636393136432792&utm_content=ANUNCIO_5|525916699209785&utm_term=Facebook_Mobile_Feed`

A credencial de API do vendedor era: `JHTbglkQnUhz7Tk2oQ4ZyuVYxBsOpC1XNdYD`.

#### 3.2.1 - Cartão Pago

`POST https://api.utmify.com.br/api-credentials/orders`

Headers:

```json
{ "x-api-token": "JHTbglkQnUhz7Tk2oQ4ZyuVYxBsOpC1XNdYD" }
```

Body:

```json
{
  "orderId": "b101ea20-72c7-473d-bcc4-416fe4d8f3be",
  "platform": "GlobalPay",
  "paymentMethod": "credit_card",
  "status": "paid",
  "createdAt": "2024-07-15 13:30:14",
  "approvedDate": "2024-07-15 13:30:14",
  "refundedAt": null,
  "customer": {
    "name": "Lucas Pereira Barros",
    "email": "lucaspbarros@gmail.com",
    "phone": "21996972147",
    "document": "24883871428",
    "country": "US",
    "ip": "242.53.157.167"
  },
  "products": [
    {
      "id": "ab341a39-52e1-4dda-92c8-ef336f2bb43c",
      "name": "T-shirt",
      "planId": "e7c5e019-3ac8-4ba1-9a11-2fcb4a4a598d",
      "planName": "Winter T-shirts",
      "quantity": 1,
      "priceInCents": 3500
    },
    {
      "id": "8d7eb04c-ee5c-4c51-b0dc-1bf104d3a37e",
      "name": "Pants",
      "planId": "49436d63-d345-4303-b4fd-f7da003e1a65",
      "planName": "Winter Pants",
      "quantity": 1,
      "priceInCents": 4000
    }
  ],
  "trackingParameters": {
    "src": null,
    "sck": null,
    "utm_source": "FB",
    "utm_campaign": "CAMPANHA_5|761832537749495",
    "utm_medium": "CONJUNTO_5|636393136432792",
    "utm_content": "ANUNCIO_5|525916699209785",
    "utm_term": "Facebook_Mobile_Feed"
  },
  "commission": {
    "totalPriceInCents": 7500,
    "gatewayFeeInCents": 375,
    "userCommissionInCents": 7125,
    "currency": "USD"
  },
  "isTest": false
}
```

#### 3.2.2 - Cartão Reembolsado

`POST https://api.utmify.com.br/api-credentials/orders`

Headers:

```json
{ "x-api-token": "JHTbglkQnUhz7Tk2oQ4ZyuVYxBsOpC1XNdYD" }
```

Body:

```json
{
  "orderId": "b101ea20-72c7-473d-bcc4-416fe4d8f3be",
  "platform": "GlobalPay",
  "paymentMethod": "credit_card",
  "status": "refunded",
  "createdAt": "2024-07-15 13:30:14",
  "approvedDate": "2024-07-15 13:30:14",
  "refundedAt": "2024-07-19 01:44:39",
  "customer": {
    "name": "Lucas Pereira Barros",
    "email": "lucaspbarros@gmail.com",
    "phone": "21996972147",
    "document": "24883871428",
    "country": "US",
    "ip": "242.53.157.167"
  },
  "products": [
    {
      "id": "ab341a39-52e1-4dda-92c8-ef336f2bb43c",
      "name": "T-shirt",
      "planId": "e7c5e019-3ac8-4ba1-9a11-2fcb4a4a598d",
      "planName": "Winter T-shirts",
      "quantity": 1,
      "priceInCents": 3500
    },
    {
      "id": "8d7eb04c-ee5c-4c51-b0dc-1bf104d3a37e",
      "name": "Pants",
      "planId": "49436d63-d345-4303-b4fd-f7da003e1a65",
 "planName": "Winter Pants",
      "quantity": 1,
      "priceInCents": 4000
    }
  ],
  "trackingParameters": {
    "src": null,
    "sck": null,
    "utm_source": "FB",
    "utm_campaign": "CAMPANHA_5|761832537749495",
    "utm_medium": "CONJUNTO_5|636393136432792",
    "utm_content": "ANUNCIO_5|525916699209785",
    "utm_term": "Facebook_Mobile_Feed"
  },
  "commission": {
    "totalPriceInCents": 7500,
    "gatewayFeeInCents": 375,
    "userCommissionInCents": 7125,
    "currency": "USD"
  },
  "isTest": false
}
```

## 4 - Perguntas Frequentes

**Como faço para acessar a Utmify e realizar a integração?**

Basta criar uma conta gratuita através do link: https://app.utmify.com.br/register.

**Como sei se as informações que enviei estão corretas?**

A nossa API realiza a validação de todos os dados enviados no payload. Serão retornados na resposta da requisição os campos inválidos e os formatos aceitos.

**Como sei se os pedidos que enviei foram salvos corretamente?**

Acesse a conta que foi utilizada para obter a credencial e navegue até a aba “Resumo”. Nela estarão as informações dos pedidos salvos na plataforma, com opções de filtros por períodos específicos.

**Recebi o seguinte erro: `API_CREDENTIAL_NOT_FOUND`. O que significa?**

O erro indica que a credencial de API não foi informada ou foi passada incorretamente nos headers da requisição. Consulte o tópico Formato da Requisição para mais detalhes.

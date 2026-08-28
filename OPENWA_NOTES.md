# Integração OpenWA — achados oficiais

O OpenWA é um gateway WhatsApp self-hosted, com REST API sob `/api`, dashboard, múltiplas sessões, QR Code, API keys e webhooks assinados com HMAC. A documentação oficial recomenda executar o gateway de forma persistente, normalmente via Docker, com dados de sessão e banco em volume persistente.

A autenticação das chamadas usa o header `X-API-Key`. O fluxo inicial cria uma sessão, inicia a sessão, obtém um QR Code e aguarda o status `ready`. Para envio de texto, o endpoint documentado é `POST /api/sessions/{sessionId}/messages/send-text`, usando um `chatId` no formato internacional sem `+` ou espaços, seguido de `@c.us`.

O SDK oficial JavaScript/TypeScript é `@rmyndharis/openwa`, mas é um cliente request/response e não mantém eventos por WebSocket; mensagens recebidas e confirmações devem ser recebidas por webhooks configurados no gateway.

A documentação também informa que OpenWA usa uma interface não oficial/reverse-engineered, portanto há risco não nulo de restrição ou banimento. Para produção, deve-se usar um número dedicado, limitar taxa de envio, trabalhar com destinatários que deram opt-in e manter um caminho alternativo ou considerar a API oficial do WhatsApp Cloud API.

## Fontes oficiais

- https://github.com/rmyndharis/OpenWA
- https://docs.open-wa.org/
- https://docs.open-wa.org/getting-started/quick-start
- https://docs.open-wa.org/sdk/overview

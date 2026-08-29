# Integração OpenWA — achados oficiais

A documentação oficial consultada em 28 de agosto de 2026 identifica o OpenWA v0.23.3 como um gateway WhatsApp self-hosted com REST API sob `/api`, SDK oficial TypeScript, múltiplas sessões, QR Code ou pairing code, webhooks HMAC e armazenamento local/PostgreSQL/S3 configurável.

Para a central do AltxCRM, cada chamada precisa usar `X-API-Key` e o `baseUrl` deve ser informado sem o sufixo `/api`, pois os paths já incluem esse prefixo. A documentação diferencia chaves `OPERATOR`, necessárias para criação de sessões e qualquer mutação/envio, de chaves `VIEWER`, que podem apenas ler sessões, chats, mensagens, contatos e grupos.

O fluxo de sessão é `POST /sessions` para criar, `POST /sessions/{sessionId}/start` para iniciar e `GET /sessions/{sessionId}/qr` para obter um PNG em data URL. O status evolui por `created`, `initializing`, `qr_ready`, `authenticating` e `ready`. O QR deve ser reconsultado se expirar; após o vínculo, o painel deve consultar status até `ready`.

O gateway expõe recursos separados para `sessions`, `messages`, `media`, `contacts`, `groups`, `channels`, `labels`, `search`, `statistics`, `webhooks` e automações. Os endpoints de leitura são paginados com `limit`/`offset`; listas de chats e mensagens não devem buscar tudo de uma vez.

Para mensagens, a documentação confirma `POST /sessions/{sessionId}/messages/send-text`, `send-image` e outros envios de mídia. Envio de texto, mídia, reação, resposta, encaminhamento e exclusão usam mensagens endereçadas por `chatId`, com indivíduos no formato `<número>@c.us` e grupos em `<id>@g.us`. Respostas usam `quotedMessageId`; leitura de conversas usa `POST /sessions/{sessionId}/chats/read`, com `chatId` e opcionalmente até 100 `messageIds`.

O SDK e a documentação também indicam que eventos recebidos devem chegar por webhooks assinados, enquanto o painel pode usar polling/leituras paginadas para montar a central. O receptor inbound do AltxCRM ainda precisa ser implementado para persistir mensagens, chats e mídia recebidos.

O OpenWA é uma interface não oficial/reverse-engineered e não é afiliado à Meta. Deve-se usar número dedicado, opt-in, limites de envio e caminho alternativo com WhatsApp Cloud API para operação crítica.

## Fontes oficiais

- https://docs.open-wa.org/
- https://docs.open-wa.org/changelog
- https://docs.open-wa.org/sdk/usage/
- https://docs.open-wa.org/api-reference/message-controller-send-image
- https://github.com/rmyndharis/OpenWA


## Endpoints confirmados para a central

A documentação oficial confirma `GET /api/sessions/:sessionId/chats` para listar chats ativos, com os mais recentes primeiro, e `POST /api/sessions/:sessionId/chats/read` para marcar uma conversa como lida. A lista de chats é paginada e deve ser consultada com limite/offset quando necessário. O receptor de mensagens recebidas deve continuar baseado em webhooks assinados, enquanto a leitura de chats pode ser feita pela API REST.

Fonte: https://docs.open-wa.org/api-reference/session-controller-get-chats
Fonte: https://docs.open-wa.org/api-reference/session-controller-mark-chat-read


## Histórico, contatos e mídia

A API oficial documenta `GET /api/sessions/:sessionId/messages/:chatId/history` para buscar o histórico diretamente do cliente WhatsApp, útil para mensagens anteriores à inicialização do gateway. Contatos são consultados por `GET /api/sessions/:sessionId/contacts` com `limit`/`offset`. Mídia armazenada pode ser baixada por `GET /api/sessions/:sessionId/messages/:chatId/:messageId/media`.

Fontes: https://docs.open-wa.org/api-reference/message-controller-get-chat-history
https://docs.open-wa.org/api-reference/contact-controller-find-all
https://docs.open-wa.org/api-reference/message-controller-get-chat-media


## Status de entrega

A documentação e o changelog do OpenWA indicam um status neutro de entrega com os estados `pending`, `sent`, `delivered`, `read` e `failed`. O campo deve ser tratado como opcional na UI, pois depende do gateway enviar a mensagem com esse metadado e de eventos/status disponíveis na sessão.

Fonte: https://docs.open-wa.org/changelog
Fonte: https://docs.open-wa.org/api-reference/message-controller-send-location/


## Resposta citada e eventos de entrega

O endpoint oficial de resposta é `POST /api/sessions/:sessionId/messages/reply`. O OpenWA documenta eventos `message.received`, `message.sent`, `message.ack` e `message.failed`, além de eventos de sessão. A central pode usar `message.ack` para refletir estados de entrega quando o gateway os encaminhar por webhook; a leitura ao vivo do histórico não garante por si só atualização de entrega.

Fontes: https://docs.open-wa.org/api-reference/message-controller-reply/
https://docs.open-wa.org/api-reference/webhook-controller-create/

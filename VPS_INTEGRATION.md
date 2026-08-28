# Integração do AltxCRM com a VPS

O AltxCRM mantém a infraestrutura de e-mail atrás de uma camada server-side. O navegador nunca recebe o token da VPS; as procedures protegidas em `server/routers.ts` chamam `server/integrations/mailVps.ts`, que exige URL HTTPS e autenticação Bearer.

## Variáveis de ambiente

Configure estas variáveis no ambiente de desenvolvimento e no ambiente de produção, sem adicioná-las ao repositório:

| Variável | Obrigatória | Uso |
|---|---:|---|
| `VPS_MAIL_API_URL` | Sim | URL base HTTPS da API de gerenciamento de e-mail, por exemplo `https://mail-api.suaempresa.com` |
| `VPS_MAIL_API_TOKEN` | Sim | Token Bearer da conta de serviço com permissões mínimas para domínios, caixas e mensagens |

## Contrato mínimo esperado

A API da VPS deve expor os endpoints abaixo. Os requests partem exclusivamente do backend do AltxCRM.

| Método | Endpoint | Operação |
|---|---|---|
| `GET` | `/health` | Verificação de conectividade |
| `GET` | `/v1/domains` | Listagem de domínios |
| `POST` | `/v1/domains` | Criação de domínio |
| `POST` | `/v1/domains/{domain}/verify` | Verificação DNS |
| `DELETE` | `/v1/domains/{domain}` | Remoção de domínio |
| `POST` | `/v1/mailboxes` | Criação de caixa postal |
| `PATCH` | `/v1/mailboxes/{email}` | Alteração de cota/status |
| `DELETE` | `/v1/mailboxes/{email}` | Remoção de caixa postal |
| `POST` | `/v1/messages` | Envio imediato ou agendado |

O endpoint `/health` deve responder JSON com `status` e, opcionalmente, `version`. Os endpoints de mutação devem responder com status HTTP 2xx e JSON quando houver payload de retorno.

## Segurança operacional

Use uma conta de serviço separada, com escopo mínimo e rotação periódica. Restrinja a API por rede ou allowlist quando possível, valide assinatura ou token no gateway da VPS e registre as ações no histórico do workspace. A aplicação rejeita URLs HTTP para a integração e para webhooks.

O AltxCRM não substitui o MTA, IMAP/POP3, antispam ou a política de backup da VPS. Esses serviços continuam sendo responsabilidade da infraestrutura. Depois de configurar as variáveis, use **Configurações → Verificar conexão** para validar o `/health` antes de criar domínios, caixas ou enviar mensagens.

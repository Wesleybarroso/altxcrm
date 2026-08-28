# Account-owned API Token do Cloudflare

A documentação oficial do Cloudflare informa que um Account-owned token é criado em **Manage Account → Account API Tokens** e exige permissão de Super Administrator para sua criação. Ele funciona como uma identidade de serviço durável, com permissões próprias, e não depende do e-mail de um usuário para autenticação.

Para o AltxCRM, a credencial correta desse tipo deve ser enviada como `Authorization: Bearer <TOKEN>` no backend. Não devemos tratá-la como Global API Key nem enviar `X-Auth-Email` e `X-Auth-Key`. O token deve ser limitado às permissões e à conta/zona necessárias, possuir expiração quando possível e permanecer fora do frontend.

Referência oficial: https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/

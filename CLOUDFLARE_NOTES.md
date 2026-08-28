# Integração Cloudflare — decisões técnicas

A integração usará um API Token do Cloudflare armazenado exclusivamente no backend, preferencialmente com as permissões `Zone:Read` e `DNS:Edit` limitadas às zonas necessárias. A documentação oficial recomenda API Tokens em vez da combinação legada de e-mail + Global API Key; o segredo é exibido uma única vez e não deve ser colocado no frontend.

O fluxo previsto é: listar zonas com `GET /zones`, consultar registros com `GET /zones/{zone_id}/dns_records`, montar uma prévia dos registros necessários para e-mail e aplicar somente as mudanças confirmadas pelo usuário com criação/atualização idempotente. Para registros MX, a API exige hostname de destino e prioridade; registros TXT/CNAME devem ser tratados como DNS-only, sem proxy.

A integração Cloudflare automatiza a camada DNS. Ela não instala Postfix/Dovecot, não cria usuários do sistema, não provisiona caixas no servidor, não configura certificados SMTP/IMAP e não define PTR/rDNS do IP. Esses passos continuam dependendo da camada segura da API da VPS de e-mail.

## Referências oficiais

- https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- https://developers.cloudflare.com/api/resources/zones/
- https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/
- https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/

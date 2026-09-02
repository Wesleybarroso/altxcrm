# AltxCRM — Guia de instalação e operação em VPS

Este documento descreve uma instalação de produção do AltxCRM em uma VPS Linux com Node.js, pnpm, MySQL/MariaDB, Nginx e systemd. O AltxCRM é um aplicativo full-stack React, Express, tRPC, Drizzle e MySQL; o comando de produção inicia o bundle em `dist/index.js` na porta definida pelo ambiente, portanto o proxy reverso deve encaminhar para a porta local escolhida sem hardcode no código da aplicação.

> **Importante:** o AltxCRM não provisiona sozinho uma VPS, um servidor SMTP/IMAP ou um gateway OpenWA. Esses serviços precisam estar acessíveis e corretamente protegidos antes da operação. Faça backup do banco e dos volumes do OpenWA antes de executar migrações ou atualizar componentes.

## 1. Pré-requisitos

A VPS deve possuir Ubuntu 22.04/24.04 ou distribuição equivalente, acesso administrativo, um domínio apontando para o IP público, certificado TLS, Node.js compatível com o projeto, pnpm, Git e um banco MySQL/MariaDB acessível. Para os fluxos WhatsApp, mantenha também uma instância OpenWA com volume persistente para as sessões e um número dedicado, com opt-in dos contatos e limites operacionais conservadores.

| Componente | Responsabilidade | Obrigatório |
| --- | --- | --- |
| Nginx ou Caddy | TLS, proxy reverso e limites de requisição | Sim |
| Node.js + pnpm | Build e execução do AltxCRM | Sim |
| MySQL/MariaDB | Usuários, workspace, agenda, logs e configurações | Sim |
| OpenWA | Sessões, chats, histórico e envio WhatsApp | Apenas para WhatsApp |
| n8n | Automação externa por webhook | Opcional |
| Serviço de e-mail da VPS | Criação e transporte de caixas corporativas | Conforme integração de e-mail |

## 2. Preparar o sistema

Execute os comandos abaixo com um usuário de deploy, reservando `sudo` apenas para pacotes e serviços do sistema. O repositório deve ser privado quando contiver configurações operacionais; nunca versionar `.env`, tokens, chaves API ou cookies de sessão.

```bash
sudo apt update
sudo apt install -y git curl nginx mysql-client
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.4.1 --activate
node --version
pnpm --version
```

Crie o diretório de aplicação, clone o repositório e instale as dependências usando o lockfile:

```bash
sudo mkdir -p /opt/altxcrm
sudo chown -R "$USER":"$USER" /opt/altxcrm
git clone <URL_DO_REPOSITORIO_PRIVADO> /opt/altxcrm
cd /opt/altxcrm
pnpm install --frozen-lockfile
```

## 3. Banco de dados

Crie um banco dedicado e um usuário com permissões apenas nesse banco. Use uma senha longa e armazene-a no gerenciador de segredos da VPS, não em um arquivo público.

```sql
CREATE DATABASE altxcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'altxcrm'@'localhost' IDENTIFIED BY '<SENHA_FORTE>'; 
GRANT ALL PRIVILEGES ON altxcrm.* TO 'altxcrm'@'localhost';
FLUSH PRIVILEGES;
```

No projeto, gere e aplique as migrações com o `DATABASE_URL` configurado. Em produção, execute esse passo durante uma janela de manutenção e faça backup antes de qualquer mudança de schema:

```bash
cd /opt/altxcrm
pnpm db:push
```

A URL deve usar o formato aceito pelo `mysql2`, por exemplo `mysql://altxcrm:<SENHA>@127.0.0.1:3306/altxcrm`. Se o banco estiver em outro servidor, restrinja firewall e usuário por IP; não exponha a porta 3306 à internet sem uma necessidade operacional clara.

## 4. Variáveis de ambiente

Crie `/etc/altxcrm/altxcrm.env` com proprietário root e permissões restritas. O servidor lê as variáveis abaixo; os valores reais devem ser substituídos pelo administrador da implantação.

| Variável | Uso |
| --- | --- |
| `NODE_ENV` | Deve ser `production` para ativar o comportamento de produção e permitir criação de lembretes Heartbeat. |
| `PORT` | Porta local do servidor Express, definida pelo ambiente. |
| `DATABASE_URL` | Conexão MySQL/MariaDB do workspace. |
| `JWT_SECRET` | Assinatura das sessões; gere um valor aleatório longo e não o reutilize. |
| `VITE_APP_ID` | Compatibilidade com OAuth Manus legado. |
| `OAUTH_SERVER_URL` | Compatibilidade com OAuth Manus legado. |
| `VITE_OAUTH_PORTAL_URL` | Compatibilidade com OAuth Manus legado. |
| `OWNER_OPEN_ID` e `OWNER_NAME` | Identidade inicial/administrativa do fluxo legado. |
| `PUBLIC_APP_URL` | URL HTTPS pública usada nos callbacks e links de recuperação. |
| `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` | Credenciais do GitHub OAuth. |
| `AUTH_FROM_EMAIL` | Remetente dos e-mails de recuperação. |
| `VPS_MAIL_API_URL` e `VPS_MAIL_API_TOKEN` | API de e-mail da VPS, alternativa ao SMTP. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` | Configuração SMTP alternativa. |
| `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY` | APIs internas usadas pelo runtime do projeto. |

Exemplo de arquivo, sem usar valores reais:

```dotenv
NODE_ENV=production
PORT=3000
PUBLIC_APP_URL=https://crm.seudominio.com
DATABASE_URL=mysql://altxcrm:<SENHA>@127.0.0.1:3306/altxcrm
JWT_SECRET=<SEGREDO_ALEATORIO_LONGO>
AUTH_FROM_EMAIL=acesso@seudominio.com
GITHUB_CLIENT_ID=<GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<GITHUB_CLIENT_SECRET>
VITE_APP_ID=<APP_ID>
OAUTH_SERVER_URL=<OAUTH_SERVER_URL>
VITE_OAUTH_PORTAL_URL=<VITE_OAUTH_PORTAL_URL>
OWNER_OPEN_ID=<OWNER_OPEN_ID>
OWNER_NAME=AltxCRM
BUILT_IN_FORGE_API_URL=<BUILT_IN_FORGE_API_URL>
BUILT_IN_FORGE_API_KEY=<BUILT_IN_FORGE_API_KEY>
```

```bash
sudo install -d -m 750 /etc/altxcrm
sudo install -o root -g root -m 640 /tmp/altxcrm.env /etc/altxcrm/altxcrm.env
```

As credenciais do Cloudflare e do OpenWA são inseridas nas telas de Integrações e WhatsApp do AltxCRM. Elas são criptografadas e mantidas no backend; não coloque essas chaves no bundle do navegador, no Git ou em mensagens de automação.

## 5. Build e primeiro teste

Compile o frontend e o servidor e execute as verificações antes de criar o serviço:

```bash
cd /opt/altxcrm
pnpm check
pnpm test
pnpm build
set -a
. /etc/altxcrm/altxcrm.env
set +a
node dist/index.js
```

Em outra sessão, confirme que o processo responde localmente:

```bash
curl -I http://127.0.0.1:3000
```

Interrompa o teste manual com `Ctrl+C` depois de validar a inicialização. O processo definitivo deve ser administrado pelo systemd, não por um terminal SSH aberto.

## 6. Serviço systemd

Crie `/etc/systemd/system/altxcrm.service`:

```ini
[Unit]
Description=AltxCRM production server
After=network-online.target mysql.service
Wants=network-online.target

[Service]
Type=simple
User=altxcrm
Group=altxcrm
WorkingDirectory=/opt/altxcrm
EnvironmentFile=/etc/altxcrm/altxcrm.env
ExecStart=/usr/bin/node /opt/altxcrm/dist/index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/opt/altxcrm

[Install]
WantedBy=multi-user.target
```

Crie o usuário de serviço e ative o processo:

```bash
sudo useradd --system --home /opt/altxcrm --shell /usr/sbin/nologin altxcrm || true
sudo chown -R altxcrm:altxcrm /opt/altxcrm
sudo systemctl daemon-reload
sudo systemctl enable --now altxcrm
sudo systemctl status altxcrm
journalctl -u altxcrm -f
```

Após cada atualização, faça backup, instale dependências, rode testes/build e reinicie com controle:

```bash
cd /opt/altxcrm
git pull --ff-only
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
sudo systemctl restart altxcrm
sudo systemctl status altxcrm
```

## 7. Nginx e TLS

Configure o domínio apontado para a VPS em `/etc/nginx/sites-available/altxcrm`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name crm.seudominio.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Ative o site e valide a configuração:

```bash
sudo ln -s /etc/nginx/sites-available/altxcrm /etc/nginx/sites-enabled/altxcrm
sudo nginx -t
sudo systemctl reload nginx
```

Em seguida, emita o certificado TLS com a autoridade certificadora escolhida. O OpenWA, os webhooks do n8n e o OAuth devem usar HTTPS em produção. Depois do TLS, mantenha o redirecionamento HTTP para HTTPS e teste login, `/api/trpc` e os endpoints de automação.

## 8. Configurar OAuth e domínio

O AltxCRM oferece login local por e-mail/senha e login social pelo GitHub. No GitHub, cadastre `https://crm.seudominio.com/api/auth/github/callback` como Authorization callback URL. Substitua o domínio pelos valores reais antes de salvar.

Configure `PUBLIC_APP_URL`, `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no arquivo de ambiente. Para recuperação de senha, defina `AUTH_FROM_EMAIL` e configure a API de e-mail da VPS ou as variáveis SMTP. Os links expiram em 30 minutos e podem ser usados uma única vez.

Faça o primeiro login em uma janela privada, verifique a criação da sessão e confirme que o usuário está isolado no próprio workspace. Não altere cookies manualmente no frontend; mudanças de domínio devem ser acompanhadas da atualização das URLs permitidas nos provedores.

## 9. OpenWA, webhooks e WhatsApp

Na tela WhatsApp, informe a URL HTTPS do gateway sem duplicar o prefixo `/api` e a API key com permissões de operação. Crie uma sessão, inicie-a, leia o QR Code e aguarde o status `ready`. O volume de dados do OpenWA deve ser persistente; perder esse volume pode exigir novo vínculo do número.

Configure no OpenWA o receptor de eventos com o endpoint:

```text
https://crm.seudominio.com/api/automation/openwa/<SEGREDO_DO_WEBHOOK>
```

O segredo é separado da API key do OpenWA. O receptor aceita `message.received`, `message.sent`, `message.ack`, `message.failed` e `session.updated`, verifica allowlist e workspace e grava metadados no feed de atividades. A central consulta esse feed periodicamente e invalida o histórico da conversa ativa quando há novo evento de mensagem. O histórico e os bytes de mídia continuam sendo lidos do gateway.

Para a automação de agenda, configure o n8n ou outro sistema para chamar:

```text
https://crm.seudominio.com/api/automation/appointments/<SEGREDO_DO_WEBHOOK>
```

Os eventos aceitos são `appointment.created`, `appointment.confirmed`, `appointment.updated`, `appointment.cancelled`, `appointment.reminder` e `appointment.rescheduled`. Para criação, envie `patientName`, `service`, `professional`, `startsAt` e `endsAt`; para lembrete e reagendamento, envie também `appointmentId` e, quando necessário, `whatsappSessionId`, `whatsappChatId` e `message`. Use timestamps ISO 8601 e mantenha os segredos fora dos logs do n8n.

A operação deve respeitar consentimento, políticas do WhatsApp e a natureza não oficial do OpenWA. Para uso crítico, alto volume ou requisitos fortes de conformidade, avalie a WhatsApp Business Platform oficial antes de ampliar o número de sessões.

## 10. n8n e Heartbeat

O n8n pode interpretar mensagens, chamar o receptor de agenda e encadear outros sistemas. Mantenha o n8n atrás de TLS, autenticação forte e firewall; não publique a interface administrativa sem proteção adicional. Configure retries com backoff e preserve o `appointmentId` para que uma repetição não crie um atendimento incorreto.

Os lembretes recorrentes da agenda usam o callback `/api/scheduled/appointment-reminder`. A criação de jobs é bloqueada quando `NODE_ENV` não é `production`, e o agendamento deve ser criado apenas depois que a aplicação publicada estiver acessível. O callback autentica chamadas de cron, busca o atendimento pelo `taskUid` persistido, usa a sessão WhatsApp salva no atendimento e evita reenvio quando `reminderSentAt` já está preenchido.

Depois de publicar, crie um lembrete pela UI e verifique o histórico do job no painel operacional. Em caso de erro, consulte `journalctl -u altxcrm`, os logs do gateway e o histórico do job; não tente contornar a autenticação do callback inserindo identificadores no corpo da requisição.

## 11. Firewall, backups e observabilidade

Abra somente SSH, HTTP e HTTPS, preferindo restringir SSH por chave e por origem administrativa. O banco, o OpenWA e o n8n devem ficar em rede privada ou com allowlist sempre que possível.

| Item | Recomendação |
| --- | --- |
| Banco | Backup diário, retenção rotativa e teste periódico de restauração. |
| OpenWA | Backup do volume das sessões e monitoramento de QR/auth. |
| Segredos | Arquivo fora do repositório, permissões `640` ou mais restritas e rotação após qualquer exposição. |
| Aplicação | `systemd` com restart automático e logs no journal. |
| Nginx | TLS renovado automaticamente e logs revisados. |
| Webhooks | HTTPS, segredos longos, allowlist de eventos e retries idempotentes. |

O backup não deve incluir chaves em texto claro. Teste uma restauração em ambiente separado antes de considerar o procedimento operacionalmente confiável.

## 12. Checklist de aceite

A instalação está pronta para uma validação controlada quando o serviço systemd permanece ativo após reboot, o domínio responde com TLS, o login OAuth cria uma sessão, o banco registra dados no workspace correto, o Cloudflare pode ser configurado pela tela de Integrações, uma sessão OpenWA chega a `ready`, uma mensagem de texto e um anexo percorrem o composer, o receptor inbound retorna erro para segredo inválido, o feed atualiza a conversa ativa, um agendamento pode ser criado e confirmado pelo WhatsApp, e o job de lembrete pode ser criado somente em produção.

A validação final de mensagem real, QR Code, mídia e lembrete depende de um OpenWA funcional, um número dedicado e credenciais fornecidas pelo operador. O código e os contratos automatizados podem ser validados sem essas credenciais, mas o transporte externo deve ser testado na VPS antes de vender o fluxo como operacional.

## Referências do projeto

As decisões deste guia correspondem aos scripts e contratos mantidos no próprio repositório:

- [`package.json`](./package.json), scripts `check`, `test`, `build`, `start` e `db:push`.
- [`server/_core/env.ts`](./server/_core/env.ts), variáveis de ambiente consumidas pelo servidor.
- [`OPENWA_NOTES.md`](./OPENWA_NOTES.md), endpoints, limites e operação do OpenWA.
- [`server/integrations/appointmentReminder.ts`](./server/integrations/appointmentReminder.ts), autenticação e idempotência do lembrete.
- [`server/integrations/appointmentWebhook.ts`](./server/integrations/appointmentWebhook.ts), eventos inbound autenticados da agenda.
- [`server/integrations/openwaWebhook.ts`](./server/integrations/openwaWebhook.ts), eventos inbound da central WhatsApp.

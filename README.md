# AltxCRM

CRM web full-stack para gestão de clientes, agendamentos, comunicação via WhatsApp e integrações operacionais. O projeto utiliza React, Vite, Express, tRPC, Drizzle ORM e MySQL/MariaDB.

> Este documento descreve a implantação em produção com Node.js e MySQL/MariaDB. As integrações externas, como OAuth, WhatsApp, e-mail, Cloudflare e armazenamento, são opcionais durante a instalação, mas precisam de suas respectivas variáveis para funcionar.

## Requisitos

| Ambiente | Requisito recomendado |
|---|---|
| VPS direta | Ubuntu 22.04/24.04, 1 GB de RAM ou mais, Node.js 22, pnpm 10, MySQL/MariaDB e Nginx |
| EasyPanel | Aplicação baseada em Dockerfile, banco MySQL/MariaDB e domínio configurado |
| Código-fonte | Acesso ao repositório GitHub e branch de produção |

A aplicação escuta na porta definida por `PORT`; se ela não for informada, usa `3000`. Em produção, o processo é iniciado com `pnpm start`.

## Variáveis de ambiente

Crie as variáveis no servidor ou no painel de implantação. **Não publique valores reais no GitHub e não versione arquivos `.env`.**

| Variável | Obrigatória | Finalidade |
|---|---:|---|
| `NODE_ENV` | Sim | Use `production`. |
| `PORT` | Não | Porta HTTP interna; padrão `3000`. |
| `DATABASE_URL` | Sim | String de conexão MySQL/MariaDB aceita pelo Drizzle, por exemplo `mysql://usuario:senha@host:3306/altxcrm`. |
| `JWT_SECRET` | Sim | Segredo longo e aleatório para sessões e criptografia de credenciais. |
| `VITE_APP_ID` | Conforme OAuth | Identificador da aplicação OAuth. |
| `OAUTH_SERVER_URL` | Conforme OAuth | URL do servidor OAuth. |
| `VITE_OAUTH_PORTAL_URL` | Conforme OAuth | URL do portal de login usada no frontend. |
| `OWNER_OPEN_ID` | Conforme OAuth | Open ID do proprietário inicial. |
| `OWNER_NAME` | Conforme OAuth | Nome do proprietário inicial. |
| `BUILT_IN_FORGE_API_URL` | Conforme storage/recursos Manus | Endpoint das APIs internas usadas por recursos integrados. |
| `BUILT_IN_FORGE_API_KEY` | Conforme storage/recursos Manus | Chave server-side das APIs internas. |
| `VITE_FRONTEND_FORGE_API_KEY` | Conforme recursos frontend | Chave exposta ao frontend somente quando o recurso exigir. |
| `VITE_FRONTEND_FORGE_API_URL` | Conforme recursos frontend | Endpoint frontend correspondente. |
| `VPS_MAIL_API_URL` | Conforme e-mail | URL HTTPS da API de e-mail na VPS. |
| `VPS_MAIL_API_TOKEN` | Conforme e-mail | Token Bearer da API de e-mail. |
| `OPENWA_API_URL` | Conforme WhatsApp | Endpoint do gateway OpenWA. |
| `OPENWA_API_TOKEN` | Conforme WhatsApp | Token do gateway OpenWA. |
| `CLOUDFLARE_API_TOKEN` | Conforme Cloudflare | Token da API Cloudflare. |
| `CLOUDFLARE_ACCOUNT_EMAIL` | Conforme Cloudflare | E-mail da conta quando a integração exigir. |
| `CLOUDFLARE_GLOBAL_API_KEY` | Conforme Cloudflare | Chave global quando a integração exigir. |

Gere um segredo seguro com `openssl rand -base64 48` e use o resultado em `JWT_SECRET`.

## Instalação direta em VPS

### 1. Preparar o servidor

Atualize o sistema, instale ferramentas básicas e habilite o firewall. Ajuste os nomes das portas conforme a política da sua VPS.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx mysql-client ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Instale Node.js 22 e pnpm 10. Em uma VPS de produção, prefira um gerenciador como `nvm` ou o repositório oficial do Node.js, conforme a política operacional do servidor.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.4.1 --activate
node --version
pnpm --version
```

### 2. Criar o banco

Crie um banco e um usuário dedicados. Execute estes comandos em uma instalação MySQL/MariaDB local ou no provedor do banco, substituindo a senha por uma senha forte.

```sql
CREATE DATABASE altxcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'altxcrm'@'%' IDENTIFIED BY 'SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON altxcrm.* TO 'altxcrm'@'%';
FLUSH PRIVILEGES;
```

A URL resultante deve ter este formato:

```text
mysql://altxcrm:SENHA_FORTE_AQUI@127.0.0.1:3306/altxcrm
```

### 3. Baixar e configurar a aplicação

```bash
sudo mkdir -p /var/www/altxcrm
sudo chown -R "$USER":"$USER" /var/www/altxcrm
git clone https://github.com/Wesleybarroso/altxcrm.git /var/www/altxcrm
cd /var/www/altxcrm
pnpm install --frozen-lockfile
nano .env
```

Preencha pelo menos:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://altxcrm:SENHA_FORTE_AQUI@127.0.0.1:3306/altxcrm
JWT_SECRET=COLE_AQUI_UM_SEGREDO_GERADO_COM_OPENSSL
```

Adicione as demais variáveis conforme as integrações habilitadas.

### 4. Aplicar migrações e gerar o build

```bash
cd /var/www/altxcrm
pnpm db:push
pnpm check
pnpm build
```

O comando `db:push` gera as migrações do schema e aplica as migrações pendentes no banco configurado. Faça backup do banco antes de executar alterações em produção.

### 5. Executar com systemd

Crie um usuário de serviço e uma unidade systemd:

```bash
sudo useradd --system --home /var/www/altxcrm --shell /usr/sbin/nologin altxcrm || true
sudo chown -R altxcrm:altxcrm /var/www/altxcrm
sudo tee /etc/systemd/system/altxcrm.service > /dev/null <<'EOF'
[Unit]
Description=AltxCRM
After=network.target

[Service]
Type=simple
User=altxcrm
Group=altxcrm
WorkingDirectory=/var/www/altxcrm
EnvironmentFile=/var/www/altxcrm/.env
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now altxcrm
sudo systemctl status altxcrm --no-pager
```

Verifique o endpoint local:

```bash
curl http://127.0.0.1:3000/health
```

### 6. Configurar Nginx e HTTPS

Crie um proxy reverso, trocando `crm.seudominio.com` pelo domínio real:

```bash
sudo tee /etc/nginx/sites-available/altxcrm > /dev/null <<'EOF'
server {
    listen 80;
    server_name crm.seudominio.com;

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
EOF
sudo ln -s /etc/nginx/sites-available/altxcrm /etc/nginx/sites-enabled/altxcrm
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d crm.seudominio.com
```

Depois do HTTPS, atualize no provedor OAuth as URLs de callback para `https://crm.seudominio.com/api/oauth/callback` e revise os endpoints de webhook.

## Instalação no EasyPanel

O repositório já inclui um `Dockerfile` de produção. No EasyPanel, crie uma aplicação do tipo **Git** e informe o repositório e a branch de produção. Se o painel solicitar o método de build, selecione **Dockerfile** e mantenha o caminho como `./Dockerfile`.

Configure a porta interna `3000` e adicione um healthcheck HTTP para `/health`. O domínio público deve apontar para a aplicação do EasyPanel; não é necessário executar Nginx dentro do container.

Crie um serviço de banco MySQL/MariaDB no próprio EasyPanel ou use um banco gerenciado. Em seguida, copie a URL de conexão para `DATABASE_URL`. O hostname do banco deve ser o hostname interno fornecido pelo EasyPanel, e não `127.0.0.1` quando o banco estiver em outro serviço.

Adicione as variáveis do quadro acima na seção **Environment**. Para uma instalação inicial, o conjunto mínimo é:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://altxcrm:SENHA@mysql:3306/altxcrm
JWT_SECRET=COLE_AQUI_UM_SEGREDO_FORTE
```

No primeiro deploy, abra o terminal do serviço e execute:

```bash
pnpm db:push
```

O Dockerfile executa `pnpm build` durante a criação da imagem e `pnpm start` na inicialização do container. Após o deploy, confirme `https://crm.seudominio.com/health` e, então, configure o callback OAuth e os webhooks com o domínio definitivo.

## Atualizações

### VPS com systemd

```bash
cd /var/www/altxcrm
sudo systemctl stop altxcrm
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm db:push
pnpm check
pnpm build
sudo chown -R altxcrm:altxcrm /var/www/altxcrm
sudo systemctl start altxcrm
sudo journalctl -u altxcrm -n 100 --no-pager
```

### EasyPanel

Faça push das alterações para a branch conectada ao serviço e acione um novo deploy. Antes de alterações de schema, faça backup do banco e execute `pnpm db:push` no terminal do serviço quando necessário.

## Diagnóstico rápido

| Sintoma | Verificação |
|---|---|
| Container reinicia | Consulte os logs e confirme `DATABASE_URL`, `JWT_SECRET` e `PORT`. |
| `/health` não responde | Confirme a porta interna `3000` no EasyPanel ou o status de `altxcrm.service` na VPS. |
| Login não retorna | Revise `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` e a URL de callback cadastrada. |
| Banco falha | Teste a conectividade, usuário, senha, nome do banco e hostname interno. |
| WhatsApp falha | Confirme endpoint, token, sessão e webhook do OpenWA. |
| Migração falha | Faça backup, confira permissões do usuário do banco e examine o SQL em `drizzle/`. |

## Validação local

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Os testes que dependem de credenciais reais de Cloudflare são opcionais e permanecem ignorados quando `RUN_LIVE_CLOUDFLARE_TEST` não está definido.

## Segurança operacional

Use HTTPS, segredos exclusivos por ambiente, banco não exposto publicamente e backups automatizados. Restrinja o acesso SSH por chave, mantenha o sistema atualizado e não envie `.env`, tokens, chaves Cloudflare ou credenciais de integração para o repositório.

## Licença

Este projeto está licenciado sob a licença MIT.

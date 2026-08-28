# Project TODO

- [x] Inicializar o projeto full-stack AltxCRM com autenticação, banco e backend
- [x] Analisar a referência visual do portfólio e definir direção editorial escura
- [x] Criar shell autenticado do painel com sidebar profissional e navegação responsiva
- [x] Implementar dashboard com métricas de domínios, caixas postais, armazenamento, mensagens e atividades
- [x] Implementar tela de login OAuth/Google, criação de conta e recuperação de senha (criação e recuperação concluídas no provedor OAuth)
- [x] Implementar gestão de domínios com adicionar, verificar, remover e instruções DNS
- [x] Implementar gestão de caixas postais com criar, editar, suspender, excluir, redefinir senha e cotas
- [x] Implementar caixa de entrada com listar, ler, redigir, enviar, responder, encaminhar, arquivar e excluir
- [x] Implementar visualização e acompanhamento de e-mails agendados
- [x] Implementar área de integrações com cadastro, teste, edição e remoção de webhooks
- [x] Estruturar camada segura de integração com a infraestrutura de e-mail da VPS
- [x] Criar schema, queries e procedures persistentes para domínios, caixas postais, mensagens, agendamentos, webhooks e atividades
- [x] Adicionar estados reais de loading, erro e vazio nos fluxos assíncronos
- [x] Criar testes Vitest para autenticação, autorização e camada segura de integração
- [x] Validar responsividade, acessibilidade, navegação e ausência de erros no navegador (rotas principais revisadas após reinício)
- [x] Revisar todo o checklist antes do checkpoint final

## Follow-up de integração real

- [x] Conectar todas as páginas novas ao backend via tRPC e remover estado local como fonte principal
- [x] Implementar fluxo de envio de mensagens e ligar resposta/encaminhamento à camada Mail VPS
- [x] Implementar criação e cancelamento persistente de e-mails agendados
- [x] Corrigir `webhooks.list` para retornar registros da tabela de webhooks
- [x] Ligar teste de conexão da VPS ao procedimento protegido e refletir erro/configuração pendente na UI
- [x] Implementar fluxo explícito de criação de conta e recuperação de acesso, ou documentar que são fornecidos pelo OAuth externo
- [x] Adicionar estados reais de loading, erro e vazio nos fluxos assíncronos
- [x] Ampliar testes Vitest para domínios, caixas postais, mensagens, agendamento e webhooks com persistência isolada
- [x] Revalidar todas as rotas no navegador sem erros de runtime e revisar acessibilidade básica

- [x] Refinar os ícones do navbar com uma linguagem mais profissional, consistente e sofisticada

## Integração Cloudflare

- [x] Adicionar armazenamento server-side criptografado para a chave API do Cloudflare
- [x] Adiar camada Cloudflare de descoberta de zonas e registros DNS — fora do escopo atual, que ficou restrito ao cadastro da chave API
- [x] Adiar pré-visualização de MX, SPF, DKIM e DMARC — prevista para uma etapa posterior de automação
- [x] Adiar aplicação automática de registros DNS — não executar alterações de zona nesta etapa
- [x] Adicionar interface mínima de Integrações para cadastrar a chave API — seleção de domínio/zona adiada conforme escopo solicitado
- [x] Documentar que a chave Cloudflare fica apenas cadastrada nesta etapa e que a automação DNS/provisionamento da VPS será posterior
- [x] Adiar testes de chamadas DNS reais — a implementação atual valida criptografia do segredo e não executa alterações no Cloudflare

- [x] Adicionar uma única opção de chave API Cloudflare dentro de Integrações, sem suporte a credencial alternativa

- [x] Simplificar Integrações para exibir apenas um campo seguro de chave API do Cloudflare dentro do site

## Integração n8n

- [x] Adicionar integração n8n com endpoint webhook HTTPS na área de Integrações
- [x] Permitir selecionar eventos e criar um webhook n8n com segredo gerado no backend
- [x] Adicionar teste de conexão real e instruções para configurar o Webhook node no n8n
- [x] Validar o fluxo n8n com 26 testes passando, build de produção e revisão visual em desktop e mobile

## Integração WhatsApp / OpenWA

- [x] Adicionar configuração segura de URL e API key do OpenWA no AltxCRM
- [x] Criar tela de sessões WhatsApp com adicionar, iniciar, status e QR Code
- [x] Adicionar envio de mensagem de teste e indicação de sessão pronta
- [x] Documentar a futura ligação de eventos OpenWA com o sistema de webhooks/n8n; receptor inbound funcional permanece como próxima etapa
- [x] Documentar requisitos de VPS persistente, volume de sessão, TLS e risco de uso de API não oficial
- [x] Criar testes server-side sem rede real e validar build/experiência da nova área

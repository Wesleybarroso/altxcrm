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

## Central completa de WhatsApp

- [x] Confirmar endpoints OpenWA para chats, mensagens, mídia, contatos e status de entrega
- [x] Criar listagem de conversas com busca, filtros, não lidas e atualização periódica
- [x] Criar leitura de mensagens por conversa e marcar como lida
- [x] Adicionar envio de texto e resposta pelo composer da central; encaminhamento e exclusão permanecem dependentes das próximas rotas OpenWA
- [x] Adicionar envio/recebimento de mídia e anexos quando suportados pelo gateway
- [x] Adicionar área de contatos, perfil do contato e ações de conversa
- [ ] Adicionar notificações e eventos inbound ligados aos webhooks/n8n
- [x] Documentar limites do OpenWA e alternativa WhatsApp Cloud API
- [x] Criar testes server-side, validar build e revisar a central em desktop/mobile

- [x] Adicionar filtros explícitos Todas, Não lidas, Grupos e Diretas na central WhatsApp
- [x] Implementar respostas citadas usando `POST /messages/reply` e `messageId`
- [x] Exibir status opcional de envio, entrega, leitura e falha quando o gateway fornecer o estado
- [ ] Criar receptor inbound autenticado para eventos OpenWA e atualizar histórico/status em tempo real


## Internacionalização

- [x] Auditar textos fixos, labels, placeholders, mensagens e estados que permanecem em português após a troca de idioma
- [x] Corrigir componentes para usar o idioma selecionado de forma consistente
- [x] Validar troca de idioma nas rotas principais e adicionar ou atualizar testes relevantes


## Correção da auditoria de internacionalização

- [x] Substituir a mutação de DOM por uma camada i18n real nos componentes e remover os principais textos hardcoded
- [x] Cobrir DashboardLayout, AppTopBar, Settings, Home, WhatsApp e demais rotas com strings traduzidas, incluindo toasts, placeholders, acessibilidade e estados
- [x] Validar manualmente a troca de idioma nas rotas autenticadas principais
- [x] Ajustar a configuração do Vitest para executar testes client-side de i18n


## Agenda odontológica integrada ao WhatsApp

- [x] Modelar pacientes, profissionais, serviços, salas e agendamentos com isolamento por workspace
- [x] Criar procedures persistentes para listar, criar, editar, cancelar e confirmar agendamentos
- [x] Criar aba de agenda com visualização mensal, semanal e diária, filtros e painel de detalhes
- [ ] Integrar confirmação, lembrete e reagendamento pelo fluxo de WhatsApp
- [x] Adicionar testes, estados de loading/erro/vazio, acessibilidade e validação responsiva

- [x] Adicionar estado vazio explícito na grade principal da agenda mês/semana/dia quando não houver consultas no período filtrado
- [x] Validar visualmente a rota /appointments em desktop e mobile no preview autenticado do projeto
- [x] Revisar acessibilidade básica da agenda: labels, aria-labels, foco de botões e ações principais dos dialogs


## Nomenclatura universal da agenda

- [x] Renomear a aba Agenda clínica para uma denominação ampla, adequada a diferentes nichos de atendimento
- [x] Atualizar os textos visíveis e as traduções PT/EN/ES relacionadas à agenda
- [x] Validar navegação, build e visual da nova nomenclatura


## Continuação solicitada

- [x] Salvar checkpoint após a renomeação universal para Agendamentos
- [ ] Conectar confirmação, lembrete e reagendamento da agenda ao fluxo de WhatsApp
- [x] Completar contatos e perfil de contato na central WhatsApp
- [x] Completar envio/recebimento de mídia quando suportado pelo gateway
- [ ] Ligar eventos inbound gerais do WhatsApp a notificações e histórico em tempo real

- [x] Adicionar procedimento protegido de confirmação de atendimento via WhatsApp com chat vinculado e registro de envio


## Ordem de prioridade confirmada

- [x] Prioridade 1: implementar envio e recebimento de mídia e anexos no WhatsApp
- [ ] Prioridade 2: implementar eventos inbound gerais e notificações em tempo real
- [ ] Prioridade 3: implementar lembretes e reagendamentos automáticos da agenda

- [x] Prioridade 1 parcial: implementar envio de imagens por base64, legenda e resposta citada, além de renderizar mídia recebida quando o gateway retornar URL

- [x] Prioridade 2 parcial: criar receptor `/api/automation/openwa/:secret` com validação de segredo, allowlist de eventos e registro isolado de mensagens/status/sessão

- [x] Prioridade 3 parcial: adicionar procedures protegidos para enviar lembretes e reagendar atendimentos com mensagem pelo WhatsApp

- [x] Adicionar teste do transporte OpenWA para envio de imagem com base64, mimetype, legenda e resposta citada

- [x] Adicionar teste do receptor inbound OpenWA para rejeitar segredo vazio ou inválido

- [x] Expor vídeo, áudio e documento no composer WhatsApp, com validação de arquivo, tipo e feedback de envio
- [x] Renderizar vídeo, áudio e documentos no histórico com player, link/cartão e fallback seguro
- [x] Adicionar testes dos endpoints de vídeo, áudio e documento e validar loading/erro de anexos na interface

- [x] Exibir cartão neutro para mídia sem URL ou tipo desconhecido, sem tentar renderizar imagem por padrão
- [ ] Validar estados de loading, sucesso e erro do envio de anexos no composer
- [ ] Revisar visualmente o composer e o histórico para os formatos de anexo suportados

- [ ] Testar client-side os estados de loading, sucesso e erro do composer para cada tipo de anexo
- [ ] Criar evidência visual específica com exemplos de imagem, vídeo, áudio e documento no histórico/composer

- [x] Expor feed protegido de atividades recentes por workspace para consumo de notificações e eventos inbound

- [x] Conectar o sino global e o feed protegido de atividades aos eventos registrados pelo receptor inbound

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
- [ ] Ampliar testes Vitest para domínios, caixas postais, mensagens, agendamento e webhooks com banco de teste
- [x] Revalidar todas as rotas no navegador sem erros de runtime e revisar acessibilidade básica

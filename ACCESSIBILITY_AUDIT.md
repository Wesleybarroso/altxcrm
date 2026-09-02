# Auditoria de acessibilidade — painel sem dados demonstrativos

**Data:** 1º de setembro de 2026  
**Escopo:** Dashboard, Domínios, Caixas postais, Caixa de entrada, Agendados, Arquivo, Integrações e Configurações.

## Verificações realizadas

As oito rotas foram renderizadas no preview em viewport desktop de 1280 × 720. Também foi feita inspeção estática dos controles após a remoção dos dados demonstrativos. Os estados vazios das listas foram revisados para confirmar que continuam legíveis e não dependem de conteúdo fictício.

Os controles de ação somente com ícone encontrados nas páginas possuem `aria-label` contextual, incluindo busca, filtro, navegação, edição, suspensão, exclusão, arquivamento e opções adicionais. Os campos de pesquisa e os campos de Configurações possuem labels visíveis ou `aria-label`; os campos do diálogo de reagendamento mantêm labels visíveis. O componente compartilhado `Button` mantém `focus-visible` com anel de foco de 3 px, sem remover o foco nativo de teclado.

A revisão também conferiu que a hierarquia visual permanece utilizável em telas sem registros: os cards exibem `0`, `—` ou mensagens como “Nenhuma mensagem encontrada”, em vez de nomes, datas, percentuais ou endpoints de exemplo. A tela de Configurações agora informa “Não configurado” e “Sincronização sob demanda” quando o workspace não possui endpoint ou ambiente registrados.

## Validação automatizada

A suíte `client/src/pages/no-demo-data.test.ts` impede o retorno dos principais placeholders históricos às páginas do painel. A rodada final passou com **50 testes aprovados e 2 ignorados**, `pnpm check` sem erros de TypeScript e `pnpm build` aprovado.

## Limitação operacional

A validação de interação com teclado foi realizada por inspeção de estrutura, classes de foco e nomes acessíveis no código e pelo preview renderizado. Uma auditoria automatizada com leitor de tela e uma prova de fluxo com gateway OpenWA real devem ser executadas na VPS após o login e a configuração das integrações, pois não há sessão de usuário ou gateway conectado no ambiente de desenvolvimento.

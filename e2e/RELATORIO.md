# Relatório de Testes E2E — CCB Patrimônio

Data: 28/06/2026  
Ambiente: https://ccbpatrimoniovalpa.vercel.app

## Resumo

| Suite | Testes | Passou | Falhou | Pulado |
|-------|--------|--------|--------|--------|
| Auth | 5 | 5 | 0 | 0 |
| Dashboard | 2 | 1 | 1 | 0 |
| Rotinas | 4 | 4 | 0 | 0 |
| Formulários | 2 | 2 | 0 | 0 |
| Checklist | 2 | 2 | 0 | 0 |
| Pendências | 1 | 1 | 0 | 0 |
| Inventário | 1 | 0 | 1 | 0 |
| Movimentos | 1 | 1 | 0 | 0 |
| Relatórios | 1 | 0 | 1 | 0 |
| Perfil | 1 | 1 | 0 | 0 |
| Mobile | 1 | 1 | 0 | 0 |
| **Total** | **21** | **18** | **3** | **0** |

Execução final: `npx playwright test --reporter=list`  
Resultado: **18 passed, 3 failed**.  
Limpeza pós-teste: `e2e/99-cleanup.spec.ts` passou e desativou os bens `Cadeira de escritório teste E2E` / `Cadeira atualizada`.

## Detalhamento por módulo

### Auth

- ✅ PASSOU — Acesso a `/dashboard` sem login redireciona para `/login`.
- ✅ PASSOU — Login com credenciais erradas exibe erro.
- ✅ PASSOU — Login com `gestor@ccb.local` redireciona para `/dashboard`.
- ✅ PASSOU — Botão `Sair` encerra sessão e volta para `/login`.
- ✅ PASSOU — Recuperação de senha abre `/login/recuperar` com campo de e-mail e botão de envio.

### Dashboard

- ✅ PASSOU — Título `Painel do Gestor`, 6 KPIs, tabela de 4 Casas e link `Ver relatório completo` visíveis.
- ❌ FALHOU — Navegação pelo sidebar desktop falhou ao clicar em `Movimentos`.
  - Esperado: URL mudar para `/movimentos`.
  - Recebido: URL permaneceu em `/dashboard`.
  - Evidência: `test-results/02-dashboard-Dashboard-sidebar-navega-pelas-rotas-principais/test-failed-1.png`.
  - Linha: `e2e/02-dashboard.spec.ts:43`.

### Rotinas

- ✅ PASSOU — Página `/rotinas` carrega com título correto.
- ✅ PASSOU — Seletor mês/ano atualiza URL e competência.
- ✅ PASSOU — Grid Form 14.8 mostra selects com opções `vazio`, `ok`, `pendente`, `nao`, `na`.
- ✅ PASSOU — Status do Form 14.8 e Controle Geral persistem após reload.

### Formulários

- ✅ PASSOU — `/formularios` carrega com competência, 4 casas e 5 etapas.
- ✅ PASSOU — `Ver detalhes` abre histórico, status pode ser alterado e dialog de upload abre/cancela corretamente.

### Checklist

- ✅ PASSOU — `/checklist` mostra 4 Casas com colunas operacionais.
- ✅ PASSOU — Dialog `Editar` abre, salva dados e `Cancelar` fecha o dialog.

### Pendências

- ✅ PASSOU — `/pendencias` carrega sem erro e exibe estado vazio ou lista agrupada.

### Inventário

- ❌ FALHOU — Fluxo de filtro por categoria após criar/editar bem causou timeout.
  - O teste conseguiu criar o bem, validar código `ADM-XXXX`, editar para `Cadeira atualizada` e abrir a tela de inventário.
  - Ao selecionar categoria `Móveis` e clicar em `Filtrar`, a página não retornou o item esperado e o snapshot de erro ficou reduzido a `alert`, indicando possível falha de renderização/navegação no filtro.
  - Evidência: `test-results/07-inventario-Inventário-c-0ccb1-ltros-exportação-importação/error-context.md`.
  - Linha: `e2e/07-inventario.spec.ts:55`.
  - Pós-condição: cleanup dedicado passou e desativou os bens de teste.

### Movimentos

- ✅ PASSOU — `/movimentos` carrega, dialog registra movimento de entrada, registro aparece na tabela, filtro por tipo funciona e botão `Exportar` está presente.

### Relatórios

- ❌ FALHOU — Clique na aba `Inventário` dentro de `/relatorios` não mudou a URL para `?tab=inventario`.
  - Esperado: `/relatorios?tab=inventario`.
  - Recebido: `/relatorios`.
  - Evidência: `test-results/09-relatorios-Relatórios-abas-e-botões-de-exportação/test-failed-1.png`.
  - Linha: `e2e/09-relatorios.spec.ts:15`.

### Perfil

- ✅ PASSOU — `/perfil` mostra dados do gestor, edição de nome, campos de senha, Administração, Auditoria e botão `Encerrar sessão`.

### Mobile

- ✅ PASSOU — Viewport 390×844: sidebar fica oculta, botão hamburguer abre drawer, links aparecem e navegação mobile funciona.

## Problemas encontrados

1. **Sidebar desktop não navega para `/movimentos` a partir do dashboard.**  
   O link está presente e visível no DOM, mas o clique não alterou a URL. Pode indicar overlay, interceptação de evento, ou problema de hidratação/estado no AppShell desktop.

2. **Aba `Inventário` em `/relatorios` não navega via clique.**  
   O link da aba está visível, mas o clique mantém a URL em `/relatorios`, impedindo o acesso à aba por interação normal.

3. **Filtro de Inventário por categoria apresenta falha/timeout após criar e editar um bem.**  
   O fluxo de criação/edição funcionou, mas o filtro por `Móveis` não manteve/renderizou o item esperado e produziu contexto de erro praticamente vazio.

## Conclusão

Sistema **parcialmente aprovado** para uso assistido em produção.  

As rotas principais, autenticação, rotinas, formulários, checklist, pendências, movimentos, perfil e mobile passaram. Os três problemas encontrados afetam navegação desktop/relatórios e confiabilidade do filtro de inventário; recomendo corrigir esses pontos antes de considerar o MVP totalmente aprovado para operação diária sem acompanhamento técnico.

# Relatório E2E V2 — CCB Patrimônio

Data: 28/06/2026  
Ambiente: https://ccbpatrimoniovalpa.vercel.app  
Credencial usada: `gestor@ccb.local`  
Comando executado:

```bash
npx playwright test e2e/12-persistencia.spec.ts e2e/13-uploads.spec.ts e2e/14-downloads.spec.ts e2e/15-validacao-formularios.spec.ts e2e/16-acessibilidade.spec.ts e2e/17-pwa.spec.ts e2e/18-seguranca-api.spec.ts e2e/19-fluxo-cruzado.spec.ts e2e/20-erros-e-estados-vazios.spec.ts e2e/21-performance.spec.ts --reporter=list
```

Testes novos: 12  
Resultado final: **2 passaram, 10 falharam**.

## Resumo

| Suite | Descrição | Passou | Falhou |
|-------|-----------|--------|--------|
| 12 | Persistência | 0 | 1 |
| 13 | Uploads | 0 | 2 |
| 14 | Downloads | 0 | 1 |
| 15 | Validação de formulários | 1 | 1 |
| 16 | Acessibilidade | 0 | 1 |
| 17 | PWA | 0 | 1 |
| 18 | Segurança de API | 0 | 1 |
| 19 | Fluxo cruzado entre módulos | 0 | 1 |
| 20 | Erros e estados vazios | 1 | 0 |
| 21 | Performance e console | 0 | 1 |
| **Total** |  | **2** | **10** |

## Bugs encontrados

1. **Checklist: edição de Ancião / Cooperador não persistiu**
   - Módulo: `/checklist`
   - Esperado: editar a primeira Casa para `Ancião Teste Persistência`, salvar, recarregar e ver o valor na tabela.
   - Real: após reload, o campo permaneceu vazio na tabela. O contexto mostra a Casa `22-0806 Central - Lavínia` com célula de Ancião vazia.
   - Evidência: `test-results/12-persistencia-12-Persist-dffbd-entos-persistem-após-reload/error-context.md`.

2. **Importação Excel SIGA não deixou bens importados visíveis na busca**
   - Módulo: `/inventario`
   - Esperado: importar `SIGA-001`, `SIGA-002`, `SIGA-003` e localizar `Mesa de reunião`, `Cadeira giratória`, `Notebook` na tabela.
   - Real: após confirmação da importação, a busca por `Mesa de reunião` não exibiu o item.
   - Observação: os códigos de teste já tinham sido usados em execução anterior e a regra atual não reativa bens desativados. Isso pode ser comportamento esperado, mas para o usuário final a importação aparenta sucesso e os bens não aparecem.

3. **Downloads: exportação CSV por Casa não disparou evento de download**
   - Módulo: `/inventario`
   - Esperado: clicar em `Exportar esta Casa (.csv)` gera download real `.csv`.
   - Real: `page.waitForEvent("download")` expirou após 120s.
   - Ponto exato: `e2e/14-downloads.spec.ts:13`.

4. **Acessibilidade: existe tabela sem `caption` ou `aria-label`**
   - Módulo: rota entre as verificadas em `/dashboard`, `/rotinas`, `/inventario`, `/movimentos`, `/relatorios`.
   - Esperado: todas as tabelas têm `caption` ou `aria-label`.
   - Real: a varredura encontrou 1 tabela sem identificação acessível.

5. **PWA: `/manifest.json` não retorna JSON público**
   - Módulo: PWA.
   - Esperado: `GET /manifest.json` retorna JSON do manifesto.
   - Real: Playwright recebeu HTML (`Unexpected token '<'`) e requisição direta sem redirecionamento retornou `307`.
   - Impacto: instalação PWA pode falhar porque o manifesto parece protegido/redirecionado.

6. **Cron mensal não retorna 401 sem Authorization**
   - Módulo: `/api/cron/resumo-mensal`.
   - Esperado: sem header `Authorization`, retornar `401`.
   - Real: no Playwright a chamada chegou como `200` após redirect; em requisição direta com redirect bloqueado retornou `307`.
   - Impacto: a rota protegida não comunica falha de autorização por status 401 como especificado.

7. **Movimentos: criação de movimento não ficou visível após salvar**
   - Módulos: `/movimentos` e `/relatorios?tab=movimentos`.
   - Esperado: criar `Fluxo Cruzado Teste` e ver o registro na tabela/relatórios.
   - Real: o registro não apareceu em `/movimentos?tipo=entrada` após salvar.
   - Evidência: `test-results/19-fluxo-cruzado-19-Fluxo--bd1c7-ios-dashboard-e-exportações/error-context.md`.

8. **Console: falhas recorrentes ao buscar RSC payload**
   - Módulo: navegação geral.
   - Esperado: rotas principais sem erros críticos de console.
   - Real: múltiplos erros `Failed to fetch RSC payload ... Falling back to browser navigation. TypeError: Failed to fetch`.
   - Impacto: a navegação tem fallback, mas produz erro de console e pode causar lentidão/intermitência.

## Falhas de teste sem bug confirmado

- **Upload PDF válido:** o teste falhou por strict mode porque havia múltiplos documentos `formulario-teste.pdf` na lista. Isso indica que uploads anteriores ficaram persistidos, mas não prova falha funcional do upload. A etapa `Escaneado` aparece como `✅`.
- **Validação de data inválida no input date:** Playwright não consegue preencher valor malformado em `input[type=date]`; a falha valida que o navegador rejeita o valor, mas o teste precisa ser refinado para não tratar isso como bug da aplicação.

## Erros de console encontrados

O teste de performance gravou `e2e/performance-v2.json`. Os erros críticos observados seguem o mesmo padrão:

```text
Failed to fetch RSC payload for https://ccbpatrimoniovalpa.vercel.app/[rota].
Falling back to browser navigation. TypeError: Failed to fetch
```

Rotas mencionadas nos erros:

- `/perfil`
- `/relatorios`
- `/pendencias`
- `/inventario`
- `/dashboard`
- `/movimentos?ano=2026&mes=6&page=1`
- `/movimentos?ano=2026&mes=6&page=2`
- `/checklist`

Não foram registrados responses `5xx` no arquivo de performance.

## Tempos de carregamento

| Rota | Tempo |
|------|-------|
| `/dashboard` | 4761 ms |
| `/rotinas` | 3969 ms |
| `/formularios` | 3631 ms |
| `/checklist` | 3641 ms |
| `/pendencias` | 5320 ms |
| `/inventario` | 5574 ms |
| `/movimentos` | 6431 ms |
| `/relatorios` | 5498 ms |
| `/perfil` | 3612 ms |

## Limpeza executada

Após a execução, foi feita limpeza de dados temporários:

- Bens de teste desativados por descrição/código: 3.
- Documentos `formulario-teste.pdf` removidos da tabela `documentos`: 4.
- Movimentos de teste removidos: 0 encontrados.

## Conclusão

Sistema **reprovado na cobertura E2E V2** até correção dos pontos acima.

Prioridade recomendada:

1. Corrigir acesso público a `/manifest.json`.
2. Corrigir status da rota `/api/cron/resumo-mensal` sem autorização.
3. Investigar persistência de edição em `/checklist`.
4. Investigar criação/listagem de movimentos.
5. Corrigir erros recorrentes de RSC payload no console.
6. Revisar exportação CSV por Casa e tabela sem identificação acessível.

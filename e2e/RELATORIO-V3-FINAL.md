# Relatório de Auditoria Final V3 — CCB Patrimônio
Data: 2026-06-28
Ciclo: Infraestrutura, Segurança HTTP, Performance, Integridade de Dados

## Scores Lighthouse

Auditoria executada em `https://ccbpatrimoniovalpa.vercel.app/login`.

| Categoria | Score | Meta | Status |
|-----------|-------|------|--------|
| Performance | 96 | 70 | ✅ |
| Accessibility | 100 | 85 | ✅ |
| Best Practices | 100 | 90 | ✅ |
| SEO | 91 | 80 | ✅ |

Principais observações do Lighthouse: `robots.txt is not valid`, `bf-cache` e pequenos pontos de performance. Nenhum score ficou abaixo da meta, então não houve correção obrigatória.

## Headers de Segurança HTTP

Antes da correção, produção retornava apenas HSTS nas rotas auditadas. Foram adicionados headers globais em `next.config.mjs` via `headers()` com `source: "/(.*)"`, e `poweredByHeader: false`.

Validação local no build final (`next start`):

| Header | Valor encontrado | Status |
|--------|------------------|--------|
| X-Frame-Options | `DENY` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` | ✅ |
| Content-Security-Policy | presente | ✅ |
| X-XSS-Protection | `0` | ✅ |
| X-Powered-By | ausente | ✅ |

Rotas verificadas no build final: `/`, `/login`, `/dashboard`, `/api/exportar/inventario`.

Cookies de sessão Supabase:
- Achado inicial em produção: cookie Supabase com `SameSite=Lax`, porém sem `HttpOnly` e sem `Secure`.
- Correção aplicada em `src/lib/supabase/server.ts` e `src/middleware.ts`: cookies definidos por Supabase SSR agora recebem `httpOnly: true`, `sameSite: "lax"` e `secure: true` em produção.

Headers internos em `/api/exportar/*`:
- `X-Powered-By` removido.
- Headers de plataforma Vercel como `server` e `x-vercel-id` podem aparecer em produção; não expõem dados da aplicação.

## Vulnerabilidades de Dependências

Comando executado: `npm audit --json`.

Correção aplicada:
- `next` atualizado de `14.2.23` para `14.2.35`.
- `eslint-config-next` atualizado de `14.2.23` para `14.2.35`.
- A vulnerabilidade crítica de middleware em Next 14 antigo foi removida do audit.

| Pacote | Severidade | CVE/GHSA | Afeta produção? | Mitigação |
|--------|------------|----------|-----------------|-----------|
| `next` | Alta | múltiplos GHSA de DoS/SSRF/cache | Sim | Atualizado para `14.2.35`; npm só oferece correção completa via `next@16.2.9`, breaking change fora do escopo deste ciclo. Planejar upgrade major. |
| `xlsx` | Alta | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 | Uso limitado | Ignorado conforme instrução; mitigado por limite de 5 MB, máximo de 1000 linhas e validação antes de persistir. |
| `eslint-config-next` / `@next/eslint-plugin-next` / `glob` | Alta | GHSA-5j98-mcp5-4vw2 | Não, devDependency | Mantido; fix automático exige `eslint-config-next@16.2.9` com salto major. |

Resumo final do audit: 0 críticas, 5 altas, 1 moderada. As altas restantes são Next major, `xlsx` explicitamente aceito, ou devDependencies.

## TypeScript Strict Mode

`tsconfig.json` já estava com `"strict": true`.

Comando executado:

```bash
npx tsc --noEmit
```

Resultado: zero erros.

## Integridade do Banco de Dados

Script temporário executado em `scripts/audit-db.ts` com Prisma. O arquivo foi removido antes do commit, conforme restrição.

| Verificação | Resultado |
|-------------|-----------|
| Usuários sem `administracaoId` | 0 ✅ |
| `Form148Status` com Casa de Oração de outra Administração | 0 ✅ |
| Documentos com `storagePath` duplicado | 0 ✅ |
| `BemPatrimonial` com `codigoInterno` duplicado na Administração | 0 ✅ |
| Movimentos de transferência para a mesma Casa | 0 ✅ |
| `AuditLog` sem `usuarioId` e sem `administracaoId` | 0 ✅ |
| `authUserId` inexistente no Supabase Auth | Não verificado: `SUPABASE_SERVICE_ROLE_KEY` ausente no ambiente local ✅/pendente |

Nenhuma inconsistência exigiu migration de correção.

## Bundle Size por Rota

Build final: Next.js `14.2.35`.

| Rota | First Load JS |
|------|---------------|
| `/inventario` | 104 kB |
| `/rotinas` | 104 kB |
| `/formularios/[casaId]` | 103 kB |
| `/checklist` | 102 kB |
| `/formularios` | 102 kB |
| `/movimentos` | 102 kB |
| `/perfil` | 102 kB |
| `/relatorios` | 102 kB |
| `/dashboard` | 100 kB |
| `/pendencias` | 100 kB |
| `/login` | 97.7 kB |

Nenhuma rota ultrapassou 200 kB. `xlsx` não aparece em bundle client-side de páginas, pois é usado em Server Actions/API routes.

## Rate Limiting

Implementado em `src/lib/rate-limit.ts` com Map em memória, suficiente para MVP em Vercel.

| Endpoint/ação | Limite | Status |
|---------------|--------|--------|
| Login (`signIn`) | 5 tentativas por IP / 15 min | ✅ |
| Recuperação de senha | 3 tentativas por e-mail / 60 min | ✅ |
| `/api/exportar/inventario` | 30 exportações por usuário+IP / 10 min | ✅ |
| `/api/exportar/controle` | 30 exportações por usuário+IP / 10 min | ✅ |
| `/api/exportar/movimentos` | 30 exportações por usuário+IP / 10 min | ✅ |

Supabase brute force protection: não verificável por código local. Precisa conferência manual no Dashboard Supabase em Authentication → Settings → Enable protection against brute force attacks.

## Print Layout

Screenshot anexada: `e2e/print-preview.png`.

Resultado: aprovado.

Observações:
- Sidebar, header, abas e botões ocultos no modo print.
- Título `CCB Patrimônio — Administração Valparaíso/SP` aparece no topo.
- Tabela principal visível e formatada.

## Código Morto Removido

Removido:
- `src/components/module-placeholder.tsx`

Mantido/documentado:
- `listCasas`, `createSupabaseBrowserClient` e exports especiais de rotas/layouts foram apontados por `ts-prune`, mas não removidos por serem Server Actions/utilitários ou falsos positivos do padrão Next.js App Router.

## Configuração de Infraestrutura

`vercel.json`:
- Cron configurado corretamente: `0 8 1 * *`.
- Nenhuma configuração deprecated identificada.
- Headers ficam apenas em `next.config.mjs`; sem duplicação no `vercel.json`.

`next.config.mjs`:
- `output` não está como `export`; SSR/Server Actions preservados.
- `images.domains` não configurado; não há imagens externas relevantes.
- `experimental.staleTimes` aceito no build do Next 14.2.35.
- Headers de segurança globais configurados.

`.env.example`:
- Variáveis documentadas: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## Conclusão Final

Sistema aprovado para uso em produção controlada do MVP.

Itens corrigidos neste ciclo:
- Headers HTTP de segurança.
- Cookies Supabase endurecidos para produção.
- Rate limiting em login, recuperação de senha e exportações.
- Atualização segura dentro de Next 14.
- `.env.example` completado com `DIRECT_URL`.
- Código morto removido.

Pendências aceitas:
- Planejar upgrade major do Next para resolver todas as vulnerabilidades altas que o npm audit só corrige via `next@16.2.9`.
- Validar manualmente no Supabase Dashboard se a proteção nativa contra força bruta está habilitada.
- Validar `authUserId` contra Supabase Auth com `SUPABASE_SERVICE_ROLE_KEY` em ambiente administrativo seguro.

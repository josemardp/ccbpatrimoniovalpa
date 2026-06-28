# DECISIONS — CCB Patrimônio

## ADR-001 — Stack da Sprint 0

**Decisão:** usar Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL/Supabase e Prisma ORM.

**Motivo:** a stack atende ao PRD com baixo custo operacional, boa compatibilidade com Vercel/Supabase e código suficientemente explícito para manutenção por agentes de código.

**Alternativas consideradas:** ferramentas no-code/low-code foram descartadas para o núcleo do produto porque os formulários oficiais da Seção 14 exigem controle fino de layout, versionamento, geração de PDF e trilha de auditoria.

## ADR-002 — Formulários e assinaturas

**Decisão:** o sistema deve suportar dois caminhos de evidência: formulário impresso, assinado fisicamente e escaneado; e assinatura digital quando validada para o fluxo.

**Motivo:** a Pré-Sprint definiu que escaneado e assinatura digital devem ser suportados. Na Sprint 0 a decisão fica registrada; as tabelas específicas de formulários serão implementadas nas sprints de formulários.

## ADR-003 — Usuários do MVP

**Decisão:** o MVP terá apenas usuários gestores com o papel `gestor_adm`.

**Motivo:** a Pré-Sprint decidiu que colaboradores das Casas de Oração não terão login no MVP. Campos de vínculo com Casa de Oração permanecem nulos/preparados para evolução, mas o papel `colaborador_casa` não é papel ativo da Sprint 0.

## ADR-004 — SIGA e importação

**Decisão:** o sistema complementa o SIGA e não o substitui. A importação por Excel do SIGA é considerada viável e será tratada na Sprint 7.

## ADR-005 — PWA offline

**Decisão:** PWA offline não é requisito do MVP.

## ADR-006 — App oficial CCB de inventário

**Decisão:** existe app oficial CCB para inventário; o novo sistema não deve conflitar com ele. Exportação para esse app entra na Sprint 12.

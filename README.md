# CCB Patrimônio

Sistema de apoio ao gestor de Patrimônio — Bens Móveis da CCB Administração Valparaíso/SP.

Este repositório contém a entrega da **Sprint 0 — Fundação**: Next.js 14, autenticação Supabase, Prisma/PostgreSQL, layout base, seed da Administração e das 4 Casas de Oração, página de perfil, rotas protegidas, bucket `documentos` documentado e ADRs iniciais.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- PostgreSQL via Supabase
- Prisma ORM

## Decisões da Pré-Sprint aplicadas

- MVP com usuários apenas do tipo `gestor_adm`.
- Sem login de `colaborador_casa` no MVP.
- Formulários devem suportar escaneado e assinatura digital.
- SIGA exporta Excel; importação fica para Sprint 7.
- PWA offline não é requisito do MVP.
- App oficial CCB existe; exportação para ele fica para Sprint 12.
- Não avançar para Sprint 1 sem aprovação do Claude Code.

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon-publica"
SUPABASE_SERVICE_ROLE_KEY=""
```

## Setup local

```bash
npm install
npx prisma generate
npx prisma migrate dev --name sprint_0_foundation
npx prisma db seed
npm run dev
```

Abra `http://localhost:3000`.

## Usuário gestor inicial

O seed cria o perfil de aplicação:

- Nome: `Gestor Patrimônio ADM`
- E-mail: `gestor@ccb.local`
- Papel: `gestor_adm`

Crie manualmente um usuário no Supabase Auth com o mesmo e-mail (`gestor@ccb.local`) e uma senha definida pela Administração. No primeiro login, o sistema vincula o `authUserId` do Supabase ao registro `usuarios`.

## Seed da Sprint 0

O comando `npx prisma db seed` cria:

- Administração Valparaíso/SP
- CNPJ `72.836.414/0001-66`
- Responsável `Mateus Corazza Neto`
- Regional `Araçatuba/SP`
- Casas:
  - `22-1689` — Central - Bento de Abreu
  - `22-5262` — Central Valparaíso
  - `22-0806` — Central - Lavínia
  - `22-3532` — Bairro Santa Casa

## Supabase Storage

Execute `supabase/storage.sql` no SQL Editor do Supabase para criar o bucket privado `documentos` e políticas básicas para usuários autenticados.

Este passo é pré-requisito para o deploy da Sprint 4, pois o upload do Form. 14.8 escaneado usa o bucket privado `documentos`. Após configurar as variáveis de ambiente do projeto, rode também:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Rotas

- `/login`
- `/dashboard`
- `/rotinas`
- `/movimentos`
- `/formularios`
- `/checklist`
- `/pendencias`
- `/inventario`
- `/relatorios`
- `/perfil`

As rotas internas exigem sessão Supabase e perfil ativo `gestor_adm`.

## Validação

```bash
npm run lint
npm run build
```

`npx prisma db seed` depende de `DATABASE_URL` apontando para um PostgreSQL acessível.

## Deploy Vercel

1. Crie um projeto no Vercel apontando para este repositório.
2. Configure as mesmas variáveis de ambiente.
3. Rode a migration/seed contra o banco Supabase antes do primeiro login.

O deploy público não foi executado na Sprint 0 local porque exige credenciais da conta Vercel/Supabase.

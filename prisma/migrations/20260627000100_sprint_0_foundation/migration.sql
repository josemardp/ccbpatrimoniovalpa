-- Sprint 0 — Fundação

CREATE TYPE "PapelUsuario" AS ENUM ('gestor_adm');

CREATE TABLE "administracoes" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "uf" TEXT NOT NULL DEFAULT 'SP',
  "cnpj" TEXT NOT NULL,
  "responsavelPatrimonio" TEXT NOT NULL,
  "regional" TEXT NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "administracoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "casas_oracao" (
  "id" TEXT NOT NULL,
  "administracaoId" TEXT NOT NULL,
  "codigoSiga" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "uf" TEXT NOT NULL DEFAULT 'SP',
  "anciaoCooperador" TEXT,
  "responsavelPatrimonio" TEXT,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "casas_oracao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
  "id" TEXT NOT NULL,
  "authUserId" TEXT,
  "administracaoId" TEXT NOT NULL,
  "casaOracaoId" TEXT,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "papel" "PapelUsuario" NOT NULL DEFAULT 'gestor_adm',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_log" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT,
  "administracaoId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "ip" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "administracoes_cnpj_key" ON "administracoes"("cnpj");
CREATE UNIQUE INDEX "casas_oracao_codigoSiga_key" ON "casas_oracao"("codigoSiga");
CREATE INDEX "casas_oracao_administracaoId_idx" ON "casas_oracao"("administracaoId");
CREATE UNIQUE INDEX "usuarios_authUserId_key" ON "usuarios"("authUserId");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "usuarios_administracaoId_idx" ON "usuarios"("administracaoId");
CREATE INDEX "usuarios_casaOracaoId_idx" ON "usuarios"("casaOracaoId");
CREATE INDEX "audit_log_usuarioId_idx" ON "audit_log"("usuarioId");
CREATE INDEX "audit_log_administracaoId_idx" ON "audit_log"("administracaoId");
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");

ALTER TABLE "casas_oracao"
ADD CONSTRAINT "casas_oracao_administracaoId_fkey"
FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_administracaoId_fkey"
FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_casaOracaoId_fkey"
FOREIGN KEY ("casaOracaoId") REFERENCES "casas_oracao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_log"
ADD CONSTRAINT "audit_log_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_log"
ADD CONSTRAINT "audit_log_administracaoId_fkey"
FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

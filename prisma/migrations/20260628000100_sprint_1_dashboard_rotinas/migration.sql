-- Sprint 1 — Dashboard e Rotinas Mensais

CREATE TYPE "StatusRotina" AS ENUM ('vazio', 'ok', 'pendente', 'nao', 'na');
CREATE TYPE "EtapaForm148" AS ENUM ('elaborado', 'ass_min', 'ins_siga', 'pendencias', 'escaneado');

CREATE TABLE "form_148_status" (
  "id" TEXT NOT NULL,
  "administracaoId" TEXT NOT NULL,
  "casaOracaoId" TEXT NOT NULL,
  "competenciaAno" INTEGER NOT NULL,
  "competenciaMes" INTEGER NOT NULL,
  "etapa" "EtapaForm148" NOT NULL,
  "status" "StatusRotina" NOT NULL DEFAULT 'vazio',
  "atualizadoPorId" TEXT,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "form_148_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "controle_mensal" (
  "id" TEXT NOT NULL,
  "administracaoId" TEXT NOT NULL,
  "tarefaId" TEXT NOT NULL,
  "competenciaAno" INTEGER NOT NULL,
  "competenciaMes" INTEGER NOT NULL,
  "status" "StatusRotina" NOT NULL DEFAULT 'vazio',
  "atualizadoPorId" TEXT,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "controle_mensal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_148_status_casaOracaoId_competenciaAno_competenciaMes_etapa_key"
ON "form_148_status"("casaOracaoId", "competenciaAno", "competenciaMes", "etapa");

CREATE INDEX "form_148_status_administracaoId_competenciaAno_competenciaMes_idx"
ON "form_148_status"("administracaoId", "competenciaAno", "competenciaMes");

CREATE UNIQUE INDEX "controle_mensal_administracaoId_tarefaId_competenciaAno_competenciaMes_key"
ON "controle_mensal"("administracaoId", "tarefaId", "competenciaAno", "competenciaMes");

CREATE INDEX "controle_mensal_administracaoId_competenciaAno_competenciaMes_idx"
ON "controle_mensal"("administracaoId", "competenciaAno", "competenciaMes");

ALTER TABLE "form_148_status"
ADD CONSTRAINT "form_148_status_administracaoId_fkey"
FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_148_status"
ADD CONSTRAINT "form_148_status_casaOracaoId_fkey"
FOREIGN KEY ("casaOracaoId") REFERENCES "casas_oracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_148_status"
ADD CONSTRAINT "form_148_status_atualizadoPorId_fkey"
FOREIGN KEY ("atualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "controle_mensal"
ADD CONSTRAINT "controle_mensal_administracaoId_fkey"
FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "controle_mensal"
ADD CONSTRAINT "controle_mensal_atualizadoPorId_fkey"
FOREIGN KEY ("atualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('entrada', 'saida', 'transferencia', 'baixa');

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "administracaoId" TEXT NOT NULL,
    "casaOracaoId" TEXT NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "competenciaMes" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "uploadadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos" (
    "id" TEXT NOT NULL,
    "administracaoId" TEXT NOT NULL,
    "casaOrigemId" TEXT,
    "casaDestinoId" TEXT,
    "tipo" "TipoMovimento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL,
    "documento" TEXT,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_casaOracaoId_competenciaAno_competenciaMes_idx" ON "documentos"("casaOracaoId", "competenciaAno", "competenciaMes");

-- CreateIndex
CREATE INDEX "movimentos_administracaoId_dataMovimento_idx" ON "movimentos"("administracaoId", "dataMovimento");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_administracaoId_fkey" FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_casaOracaoId_fkey" FOREIGN KEY ("casaOracaoId") REFERENCES "casas_oracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_uploadadoPorId_fkey" FOREIGN KEY ("uploadadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_administracaoId_fkey" FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_casaOrigemId_fkey" FOREIGN KEY ("casaOrigemId") REFERENCES "casas_oracao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_casaDestinoId_fkey" FOREIGN KEY ("casaDestinoId") REFERENCES "casas_oracao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "controle_mensal_administracaoId_competenciaAno_competenciaMes_i" RENAME TO "controle_mensal_administracaoId_competenciaAno_competenciaM_idx";

-- RenameIndex
ALTER INDEX "controle_mensal_administracaoId_tarefaId_competenciaAno_compete" RENAME TO "controle_mensal_administracaoId_tarefaId_competenciaAno_com_key";

-- RenameIndex
ALTER INDEX "form_148_status_administracaoId_competenciaAno_competenciaMes_i" RENAME TO "form_148_status_administracaoId_competenciaAno_competenciaM_idx";

-- RenameIndex
ALTER INDEX "form_148_status_casaOracaoId_competenciaAno_competenciaMes_etap" RENAME TO "form_148_status_casaOracaoId_competenciaAno_competenciaMes__key";

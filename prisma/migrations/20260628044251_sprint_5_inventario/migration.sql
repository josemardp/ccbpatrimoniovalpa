-- CreateEnum
CREATE TYPE "EstadoConservacao" AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'descartado');

-- CreateTable
CREATE TABLE "bens_patrimoniais" (
    "id" TEXT NOT NULL,
    "administracaoId" TEXT NOT NULL,
    "casaOracaoId" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "dataAquisicao" TIMESTAMP(3),
    "valorAquisicao" DECIMAL(12,2),
    "estadoConservacao" "EstadoConservacao" NOT NULL DEFAULT 'bom',
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bens_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bens_patrimoniais_casaOracaoId_idx" ON "bens_patrimoniais"("casaOracaoId");

-- CreateIndex
CREATE INDEX "bens_patrimoniais_administracaoId_categoria_idx" ON "bens_patrimoniais"("administracaoId", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "bens_patrimoniais_administracaoId_codigoInterno_key" ON "bens_patrimoniais"("administracaoId", "codigoInterno");

-- AddForeignKey
ALTER TABLE "bens_patrimoniais" ADD CONSTRAINT "bens_patrimoniais_administracaoId_fkey" FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bens_patrimoniais" ADD CONSTRAINT "bens_patrimoniais_casaOracaoId_fkey" FOREIGN KEY ("casaOracaoId") REFERENCES "casas_oracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bens_patrimoniais" ADD CONSTRAINT "bens_patrimoniais_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

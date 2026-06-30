-- CreateTable
CREATE TABLE "tarefas_adm" (
    "id" TEXT NOT NULL,
    "administracaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" TIMESTAMP(3),
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "criadaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_adm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarefas_adm_administracaoId_concluida_idx" ON "tarefas_adm"("administracaoId", "concluida");

-- AddForeignKey
ALTER TABLE "tarefas_adm" ADD CONSTRAINT "tarefas_adm_administracaoId_fkey" FOREIGN KEY ("administracaoId") REFERENCES "administracoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_adm" ADD CONSTRAINT "tarefas_adm_criadaPorId_fkey" FOREIGN KEY ("criadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

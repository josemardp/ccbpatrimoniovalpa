"use server";

import { revalidatePath } from "next/cache";
import type { EtapaForm148, StatusRotina } from "@prisma/client";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS } from "@/lib/sprint1";

function validateMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Competência mensal inválida.");
  }
}

function validateYear(year: number) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error("Ano de competência inválido.");
  }
}

function validateStatus(status: string, allowNa: boolean): StatusRotina {
  const allowed = allowNa ? ["vazio", "ok", "pendente", "nao", "na"] : ["vazio", "ok", "pendente", "nao"];

  if (!allowed.includes(status)) {
    throw new Error("Status inválido.");
  }

  return status as StatusRotina;
}

export async function getSprint1Data(year: number, month: number) {
  validateYear(year);
  validateMonth(month);

  const { profile } = await requireGestorAdm();

  const [administracao, form148Statuses, controlesMensais] = await Promise.all([
    prisma.administracao.findUnique({
      where: { id: profile.administracaoId },
      include: { casas: { where: { ativa: true }, orderBy: { codigoSiga: "asc" } } },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        competenciaAno: year,
        competenciaMes: { lte: month },
      },
      select: {
        casaOracaoId: true,
        competenciaMes: true,
        etapa: true,
        status: true,
      },
    }),
    prisma.controleMensal.findMany({
      where: {
        administracaoId: profile.administracaoId,
        competenciaAno: year,
      },
      select: {
        tarefaId: true,
        competenciaMes: true,
        status: true,
      },
    }),
  ]);

  if (!administracao) {
    throw new Error("Administração não encontrada.");
  }

  return {
    userId: profile.id,
    administracao: {
      id: administracao.id,
      nome: administracao.nome,
      cnpj: administracao.cnpj,
      responsavelPatrimonio: administracao.responsavelPatrimonio,
      regional: administracao.regional,
    },
    casas: administracao.casas.map((casa) => ({
      id: casa.id,
      codigoSiga: casa.codigoSiga,
      nome: casa.nome,
      cidade: casa.cidade,
      responsavelPatrimonio: casa.responsavelPatrimonio,
    })),
    form148Statuses,
    controlesMensais,
    tarefas: CONTROLE_TAREFAS,
    etapas: FORM_148_ETAPAS,
  };
}

export async function updateForm148Status(input: {
  casaOracaoId: string;
  year: number;
  month: number;
  etapa: string;
  status: string;
}) {
  validateYear(input.year);
  validateMonth(input.month);

  const etapaValida = FORM_148_ETAPAS.some((etapa) => etapa.id === input.etapa);
  if (!etapaValida) {
    throw new Error("Etapa do Form. 14.8 inválida.");
  }

  const status = validateStatus(input.status, false);
  const { profile } = await requireGestorAdm();

  const casa = await prisma.casaOracao.findFirst({
    where: {
      id: input.casaOracaoId,
      administracaoId: profile.administracaoId,
      ativa: true,
    },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }

  const row = await prisma.form148Status.upsert({
    where: {
      casaOracaoId_competenciaAno_competenciaMes_etapa: {
        casaOracaoId: input.casaOracaoId,
        competenciaAno: input.year,
        competenciaMes: input.month,
        etapa: input.etapa as EtapaForm148,
      },
    },
    update: {
      status,
      atualizadoPorId: profile.id,
    },
    create: {
      administracaoId: profile.administracaoId,
      casaOracaoId: input.casaOracaoId,
      competenciaAno: input.year,
      competenciaMes: input.month,
      etapa: input.etapa as EtapaForm148,
      status,
      atualizadoPorId: profile.id,
    },
    select: {
      casaOracaoId: true,
      competenciaMes: true,
      etapa: true,
      status: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "form148_status.update",
      entity: "Form148Status",
      entityId: `${input.casaOracaoId}:${input.year}:${input.month}:${input.etapa}`,
      metadata: { status },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/rotinas");
  return row;
}

export async function updateControleMensal(input: {
  tarefaId: string;
  year: number;
  month: number;
  status: string;
}) {
  validateYear(input.year);
  validateMonth(input.month);

  const tarefaValida = CONTROLE_TAREFAS.some((tarefa) => tarefa.id === input.tarefaId);
  if (!tarefaValida) {
    throw new Error("Tarefa de controle mensal inválida.");
  }

  const status = validateStatus(input.status, true);
  const { profile } = await requireGestorAdm();

  const row = await prisma.controleMensal.upsert({
    where: {
      administracaoId_tarefaId_competenciaAno_competenciaMes: {
        administracaoId: profile.administracaoId,
        tarefaId: input.tarefaId,
        competenciaAno: input.year,
        competenciaMes: input.month,
      },
    },
    update: {
      status,
      atualizadoPorId: profile.id,
    },
    create: {
      administracaoId: profile.administracaoId,
      tarefaId: input.tarefaId,
      competenciaAno: input.year,
      competenciaMes: input.month,
      status,
      atualizadoPorId: profile.id,
    },
    select: {
      tarefaId: true,
      competenciaMes: true,
      status: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "controle_mensal.update",
      entity: "ControleMensal",
      entityId: `${input.tarefaId}:${input.year}:${input.month}`,
      metadata: { status },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/rotinas");
  return row;
}


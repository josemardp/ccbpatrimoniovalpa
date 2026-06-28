"use server";

import { revalidatePath } from "next/cache";
import type { EtapaForm148, StatusRotina } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS } from "@/lib/sprint1";

function parseStatus(input: string | FormData) {
  return input instanceof FormData ? String(input.get("status") ?? "vazio") : input;
}

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

function validateStatus(status: string): StatusRotina {
  if (!["vazio", "ok", "pendente", "nao", "na"].includes(status)) {
    throw new Error("Status inválido.");
  }

  return status as StatusRotina;
}

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem alterar rotinas.");
  }

  return currentUser.profile;
}

export async function updateForm148Status(
  casaId: string,
  ano: number,
  mes: number,
  etapa: string,
  statusInput: string | FormData,
) {
  validateYear(ano);
  validateMonth(mes);

  const etapaValida = FORM_148_ETAPAS.some((item) => item.id === etapa);
  if (!etapaValida) {
    throw new Error("Etapa do Form. 14.8 inválida.");
  }

  const status = validateStatus(parseStatus(statusInput));
  const profile = await requireGestorForAction();

  const casa = await prisma.casaOracao.findFirst({
    where: {
      id: casaId,
      administracaoId: profile.administracaoId,
      ativa: true,
    },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }

  await prisma.form148Status.upsert({
    where: {
      casaOracaoId_competenciaAno_competenciaMes_etapa: {
        casaOracaoId: casaId,
        competenciaAno: ano,
        competenciaMes: mes,
        etapa: etapa as EtapaForm148,
      },
    },
    update: {
      status,
      atualizadoPorId: profile.id,
    },
    create: {
      administracaoId: profile.administracaoId,
      casaOracaoId: casaId,
      competenciaAno: ano,
      competenciaMes: mes,
      etapa: etapa as EtapaForm148,
      status,
      atualizadoPorId: profile.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "form148_status.update",
      entity: "Form148Status",
      entityId: `${casaId}:${ano}:${mes}:${etapa}`,
      metadata: { status },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/rotinas");
  revalidatePath("/pendencias");
}

export async function updateControleMensal(
  tarefaId: string,
  ano: number,
  mes: number,
  statusInput: string | FormData,
) {
  validateYear(ano);
  validateMonth(mes);

  const tarefaValida = CONTROLE_TAREFAS.some((item) => item.id === tarefaId);
  if (!tarefaValida) {
    throw new Error("Tarefa de controle mensal inválida.");
  }

  const status = validateStatus(parseStatus(statusInput));
  const profile = await requireGestorForAction();

  await prisma.controleMensal.upsert({
    where: {
      administracaoId_tarefaId_competenciaAno_competenciaMes: {
        administracaoId: profile.administracaoId,
        tarefaId,
        competenciaAno: ano,
        competenciaMes: mes,
      },
    },
    update: {
      status,
      atualizadoPorId: profile.id,
    },
    create: {
      administracaoId: profile.administracaoId,
      tarefaId,
      competenciaAno: ano,
      competenciaMes: mes,
      status,
      atualizadoPorId: profile.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "controle_mensal.update",
      entity: "ControleMensal",
      entityId: `${tarefaId}:${ano}:${mes}`,
      metadata: { status },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/rotinas");
  revalidatePath("/pendencias");
}


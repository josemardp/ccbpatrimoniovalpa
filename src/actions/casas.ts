"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem alterar Casas de Oração.");
  }

  return currentUser.profile;
}

export async function listCasas() {
  const profile = await requireGestorForAction();

  return prisma.casaOracao.findMany({
    where: { administracaoId: profile.administracaoId },
    orderBy: { codigoSiga: "asc" },
  });
}

export async function updateCasa(id: string, dados: FormData | { anciaoCooperador?: string; responsavelPatrimonio?: string }) {
  const profile = await requireGestorForAction();
  const anciaoCooperador =
    dados instanceof FormData ? String(dados.get("anciaoCooperador") ?? "").trim() : dados.anciaoCooperador?.trim() ?? "";
  const responsavelPatrimonio =
    dados instanceof FormData
      ? String(dados.get("responsavelPatrimonio") ?? "").trim()
      : dados.responsavelPatrimonio?.trim() ?? "";

  const casa = await prisma.casaOracao.findFirst({
    where: { id, administracaoId: profile.administracaoId },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }

  await prisma.casaOracao.update({
    where: { id, administracaoId: profile.administracaoId },
    data: {
      anciaoCooperador,
      responsavelPatrimonio,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "casa_oracao.update",
      entity: "CasaOracao",
      entityId: id,
      metadata: { anciaoCooperador, responsavelPatrimonio },
    },
  });

  revalidatePath("/checklist", "layout");
}

"use server";

import type { EstadoConservacao, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ESTADOS = ["otimo", "bom", "regular", "ruim", "descartado"] as const;
const CATEGORIAS = ["Móveis", "Eletrônicos", "Instrumentos Musicais", "Veículos", "Imóveis", "Outros"] as const;

type BemFiltros = {
  casaId?: string;
  categoria?: string;
  estado?: string;
  busca?: string;
  page?: number;
};

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem gerenciar inventário.");
  }

  return currentUser.profile;
}

function parseOptional(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed.length > 0 ? parsed : null;
}

function parseRequired(value: FormDataEntryValue | null, field: string) {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    throw new Error(`${field} é obrigatório.`);
  }

  return parsed;
}

function parseEstado(value: FormDataEntryValue | string | null): EstadoConservacao {
  const parsed = String(value ?? "bom");
  if (!ESTADOS.includes(parsed as EstadoConservacao)) {
    throw new Error("Estado de conservação inválido.");
  }

  return parsed as EstadoConservacao;
}

function parseCategoria(value: FormDataEntryValue | null) {
  const parsed = parseRequired(value, "Categoria");
  if (!CATEGORIAS.includes(parsed as (typeof CATEGORIAS)[number])) {
    throw new Error("Categoria inválida.");
  }

  return parsed;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de aquisição inválida.");
  }

  return date;
}

function parseDecimalString(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Valor de aquisição inválido.");
  }

  return parsed.toFixed(2);
}

async function ensureCasaBelongsToAdmin(casaId: string, administracaoId: string) {
  const casa = await prisma.casaOracao.findFirst({
    where: { id: casaId, administracaoId, ativa: true },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }
}

function dataFromFormData(dados: FormData) {
  return {
    casaOracaoId: parseRequired(dados.get("casaOracaoId"), "Casa de Oração"),
    descricao: parseRequired(dados.get("descricao"), "Descrição"),
    categoria: parseCategoria(dados.get("categoria")),
    marca: parseOptional(dados.get("marca")),
    modelo: parseOptional(dados.get("modelo")),
    numeroSerie: parseOptional(dados.get("numeroSerie")),
    dataAquisicao: parseDate(dados.get("dataAquisicao")),
    valorAquisicao: parseDecimalString(dados.get("valorAquisicao")),
    estadoConservacao: parseEstado(dados.get("estadoConservacao")),
    observacoes: parseOptional(dados.get("observacoes")),
  };
}

async function nextCodigoInterno(administracaoId: string, tx: Prisma.TransactionClient) {
  const ultimo = await tx.bemPatrimonial.findFirst({
    where: { administracaoId, codigoInterno: { startsWith: "ADM-" } },
    orderBy: { codigoInterno: "desc" },
    select: { codigoInterno: true },
  });
  const lastNumber = Number(ultimo?.codigoInterno.replace("ADM-", "") ?? 0);

  return `ADM-${String(lastNumber + 1).padStart(4, "0")}`;
}

export async function listBens(filtros: BemFiltros = {}) {
  const profile = await requireGestorForAction();
  const page = Number.isInteger(filtros.page) && filtros.page && filtros.page > 0 ? filtros.page : 1;
  const where: Prisma.BemPatrimonialWhereInput = {
    administracaoId: profile.administracaoId,
    ativo: true,
  };

  if (filtros.casaId) {
    where.casaOracaoId = filtros.casaId;
  }

  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }

  if (filtros.estado) {
    where.estadoConservacao = parseEstado(filtros.estado);
  }

  if (filtros.busca) {
    where.OR = [
      { descricao: { contains: filtros.busca, mode: "insensitive" } },
      { codigoInterno: { contains: filtros.busca, mode: "insensitive" } },
    ];
  }

  return prisma.bemPatrimonial.findMany({
    where,
    orderBy: { codigoInterno: "asc" },
    skip: (page - 1) * 25,
    take: 25,
    include: {
      casaOracao: { select: { codigoSiga: true, nome: true } },
      registradoPor: { select: { nome: true, email: true } },
    },
  });
}

export async function criarBem(dados: FormData) {
  const profile = await requireGestorForAction();
  const data = dataFromFormData(dados);
  await ensureCasaBelongsToAdmin(data.casaOracaoId, profile.administracaoId);

  const bem = await prisma.$transaction(async (tx) => {
    const codigoInterno = await nextCodigoInterno(profile.administracaoId, tx);
    return tx.bemPatrimonial.create({
      data: {
        administracaoId: profile.administracaoId,
        codigoInterno,
        casaOracaoId: data.casaOracaoId,
        descricao: data.descricao,
        categoria: data.categoria,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numeroSerie,
        dataAquisicao: data.dataAquisicao,
        valorAquisicao: data.valorAquisicao,
        estadoConservacao: data.estadoConservacao,
        observacoes: data.observacoes,
        registradoPorId: profile.id,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "bem_patrimonial.create",
      entity: "BemPatrimonial",
      entityId: bem.id,
      metadata: { codigoInterno: bem.codigoInterno, casaOracaoId: bem.casaOracaoId },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/inventario");
}

export async function atualizarBem(id: string, dados: FormData) {
  const profile = await requireGestorForAction();
  const data = dataFromFormData(dados);
  await ensureCasaBelongsToAdmin(data.casaOracaoId, profile.administracaoId);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.bemPatrimonial.findFirst({
      where: { id, administracaoId: profile.administracaoId, ativo: true },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Bem patrimonial inválido para esta Administração.");
    }

    await tx.bemPatrimonial.update({
      where: { id, administracaoId: profile.administracaoId },
      data,
    });
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "bem_patrimonial.update",
      entity: "BemPatrimonial",
      entityId: id,
      metadata: {
        casaOracaoId: data.casaOracaoId,
        estadoConservacao: data.estadoConservacao,
        categoria: data.categoria,
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/inventario");
}

export async function desativarBem(id: string) {
  const profile = await requireGestorForAction();
  const existing = await prisma.bemPatrimonial.findFirst({
    where: { id, administracaoId: profile.administracaoId, ativo: true },
    select: { id: true, codigoInterno: true },
  });

  if (!existing) {
    throw new Error("Bem patrimonial inválido para esta Administração.");
  }

  await prisma.bemPatrimonial.update({
    where: { id },
    data: { ativo: false },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "bem_patrimonial.deactivate",
      entity: "BemPatrimonial",
      entityId: id,
      metadata: { codigoInterno: existing.codigoInterno },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/inventario");
}

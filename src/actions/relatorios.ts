"use server";

import type { EstadoConservacao, TipoMovimento } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS } from "@/lib/sprint1";

const ESTADOS: EstadoConservacao[] = ["otimo", "bom", "regular", "ruim", "descartado"];
const TIPOS_MOVIMENTO: TipoMovimento[] = ["entrada", "saida", "transferencia", "baixa"];

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem acessar relatórios.");
  }

  return currentUser.profile;
}

function validateCompetencia(ano: number, mes: number) {
  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) {
    throw new Error("Ano de competência inválido.");
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error("Mês de competência inválido.");
  }
}

function previousCompetencia() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return { ano: date.getFullYear(), mes: date.getMonth() + 1 };
}

export async function relatorioForm148(ano: number, mes: number) {
  const profile = await requireGestorForAction();
  validateCompetencia(ano, mes);

  const [casas, statuses] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    prisma.form148Status.findMany({
      where: { administracaoId: profile.administracaoId, competenciaAno: ano, competenciaMes: mes },
      select: { casaOracaoId: true, etapa: true, status: true },
    }),
  ]);

  return casas.map((casa) => {
    const etapas = Object.fromEntries(
      FORM_148_ETAPAS.map((etapa) => {
        const row = statuses.find((status) => status.casaOracaoId === casa.id && status.etapa === etapa.id);
        return [etapa.id, row?.status ?? "vazio"];
      }),
    );
    const etapasOk = Object.values(etapas).filter((status) => status === "ok").length;

    return {
      casa,
      etapas,
      percentual: Math.round((etapasOk / FORM_148_ETAPAS.length) * 100),
      concluido: etapasOk === FORM_148_ETAPAS.length,
      vazio: etapasOk === 0 && Object.values(etapas).every((status) => status === "vazio"),
    };
  });
}

export async function relatorioInventario(filtros: { casaId?: string; categoria?: string } = {}) {
  const profile = await requireGestorForAction();
  const casas = await prisma.casaOracao.findMany({
    where: {
      administracaoId: profile.administracaoId,
      ativa: true,
      ...(filtros.casaId ? { id: filtros.casaId } : {}),
    },
    orderBy: { codigoSiga: "asc" },
    select: { id: true, codigoSiga: true, nome: true },
  });
  const bens = await prisma.bemPatrimonial.findMany({
    where: {
      administracaoId: profile.administracaoId,
      ativo: true,
      ...(filtros.casaId ? { casaOracaoId: filtros.casaId } : {}),
      ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
    },
    select: {
      casaOracaoId: true,
      valorAquisicao: true,
      estadoConservacao: true,
    },
  });

  const porCasa = casas.map((casa) => {
    const bensDaCasa = bens.filter((bem) => bem.casaOracaoId === casa.id);
    const breakdown = Object.fromEntries(
      ESTADOS.map((estado) => [estado, bensDaCasa.filter((bem) => bem.estadoConservacao === estado).length]),
    ) as Record<EstadoConservacao, number>;

    return {
      casa,
      totalBens: bensDaCasa.length,
      valorTotal: bensDaCasa.reduce((sum, bem) => sum + Number(bem.valorAquisicao ?? 0), 0),
      breakdown,
    };
  });

  return {
    porCasa,
    totalGeral: {
      totalBens: bens.length,
      valorTotal: bens.reduce((sum, bem) => sum + Number(bem.valorAquisicao ?? 0), 0),
      breakdown: Object.fromEntries(
        ESTADOS.map((estado) => [estado, bens.filter((bem) => bem.estadoConservacao === estado).length]),
      ) as Record<EstadoConservacao, number>,
    },
  };
}

export async function relatorioMovimentos(ano: number, mes: number) {
  const profile = await requireGestorForAction();
  validateCompetencia(ano, mes);

  const start = new Date(ano, mes - 1, 1);
  const end = new Date(ano, mes, 1);
  const movimentos = await prisma.movimento.findMany({
    where: {
      administracaoId: profile.administracaoId,
      dataMovimento: { gte: start, lt: end },
    },
    orderBy: { dataMovimento: "desc" },
    include: {
      casaOrigem: { select: { codigoSiga: true, nome: true } },
      casaDestino: { select: { codigoSiga: true, nome: true } },
      registradoPor: { select: { nome: true, email: true } },
    },
  });

  return {
    resumo: Object.fromEntries(
      TIPOS_MOVIMENTO.map((tipo) => [tipo, movimentos.filter((movimento) => movimento.tipo === tipo).length]),
    ) as Record<TipoMovimento, number>,
    movimentos,
  };
}

export async function relatorioPendencias() {
  const profile = await requireGestorForAction();
  const anterior = previousCompetencia();
  const [casas, formPendencias, controlePendencias] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
      include: { casaOracao: { select: { id: true, codigoSiga: true, nome: true } } },
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
    }),
    prisma.controleMensal.findMany({
      where: {
        administracaoId: profile.administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
    }),
  ]);

  const porCasa = casas.map((casa) => ({
    casa,
    itens: formPendencias
      .filter((item) => item.casaOracaoId === casa.id)
      .map((item) => ({
        id: item.id,
        tipo: "Form. 14.8",
        competenciaAno: item.competenciaAno,
        competenciaMes: item.competenciaMes,
        descricao: FORM_148_ETAPAS.find((etapa) => etapa.id === item.etapa)?.label ?? item.etapa,
        status: item.status,
      })),
  }));

  return {
    porCasa,
    controleGeral: controlePendencias.map((item) => ({
      id: item.id,
      tipo: "Controle Geral",
      competenciaAno: item.competenciaAno,
      competenciaMes: item.competenciaMes,
      descricao: CONTROLE_TAREFAS.find((tarefa) => tarefa.id === item.tarefaId)?.label ?? item.tarefaId,
      status: item.status,
    })),
  };
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportarInventarioCSV() {
  const profile = await requireGestorForAction();
  const bens = await prisma.bemPatrimonial.findMany({
    where: { administracaoId: profile.administracaoId, ativo: true },
    orderBy: { codigoInterno: "asc" },
    include: { casaOracao: { select: { codigoSiga: true, nome: true } } },
  });
  const header = [
    "Código",
    "Descrição",
    "Categoria",
    "Marca",
    "Modelo",
    "Nº Série",
    "Data Aquisição",
    "Valor",
    "Estado",
    "Casa de Oração",
  ];
  const rows = bens.map((bem) => [
    bem.codigoInterno,
    bem.descricao,
    bem.categoria,
    bem.marca,
    bem.modelo,
    bem.numeroSerie,
    bem.dataAquisicao ? bem.dataAquisicao.toISOString().slice(0, 10) : "",
    bem.valorAquisicao?.toString() ?? "",
    bem.estadoConservacao,
    `${bem.casaOracao.codigoSiga} · ${bem.casaOracao.nome}`,
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
}

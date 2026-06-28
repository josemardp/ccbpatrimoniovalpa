"use server";

import type { EstadoConservacao, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import type { BemImportInput, ImportacaoErro, ImportacaoPreview } from "@/lib/importacao-types";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 1000;
const ESTADOS: EstadoConservacao[] = ["otimo", "bom", "regular", "ruim", "descartado"];
const CATEGORIAS = ["Móveis", "Eletrônicos", "Instrumentos Musicais", "Veículos", "Imóveis", "Outros"] as const;

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem importar dados do SIGA.");
  }

  return currentUser.profile;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ª]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function getByAliases(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (alias in row) {
      return row[alias];
    }
  }

  for (const [key, value] of Object.entries(row)) {
    if (aliases.some((alias) => key.includes(alias))) {
      return value;
    }
  }

  return null;
}

function normalizeEstado(value: unknown): EstadoConservacao {
  const text = normalizeHeader(normalizeText(value));
  if (!text) return "bom";
  if (["otimo", "excelente"].includes(text)) return "otimo";
  if (text === "bom") return "bom";
  if (text === "regular") return "regular";
  if (["ruim", "pessimo", "péssimo"].includes(text)) return "ruim";
  if (["descartado", "baixa", "baixado"].includes(text)) return "descartado";

  return ESTADOS.includes(text as EstadoConservacao) ? (text as EstadoConservacao) : "bom";
}

function normalizeDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = normalizeText(value);
  if (!text) return null;

  const brDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function normalizeMoney(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/[R$\s.]/g, "").replace(",", ".") : text.replace(/[R$\s]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : null;
}

function normalizeRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }
    return normalized;
  });
}

function lookupCasaId(value: unknown, casas: { id: string; codigoSiga: string; nome: string }[]) {
  const text = normalizeHeader(normalizeText(value));
  if (!text) return null;

  const casa = casas.find((item) => {
    const codigo = normalizeHeader(item.codigoSiga);
    const nome = normalizeHeader(item.nome);
    return text === codigo || text.includes(codigo) || text === nome || text.includes(nome);
  });

  return casa?.id ?? null;
}

export async function parsearExcelSiga(formData: FormData): Promise<ImportacaoPreview> {
  const profile = await requireGestorForAction();
  const arquivo = formData.get("arquivo");
  const casaSelecionada = normalizeText(formData.get("casaOracaoId"));

  if (!(arquivo instanceof File)) {
    throw new Error("Arquivo Excel obrigatório.");
  }

  const lowerName = arquivo.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
    throw new Error("Envie um arquivo .xlsx ou .xls.");
  }

  if (arquivo.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo maior que 5 MB.");
  }

  const [casas, buffer] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    arquivo.arrayBuffer(),
  ]);
  const selectedCasa = casas.find((casa) => casa.id === casaSelecionada);
  if (!selectedCasa) {
    throw new Error("Selecione uma Casa de Oração válida.");
  }

  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false });
  const rows = normalizeRows(rawRows.slice(0, MAX_ROWS));
  const erros: ImportacaoErro[] = [];
  const validas: BemImportInput[] = [];

  if (rawRows.length > MAX_ROWS) {
    erros.push({ linha: MAX_ROWS + 2, motivo: `Arquivo limitado a ${MAX_ROWS} linhas. Linhas excedentes foram ignoradas.` });
  }

  rows.forEach((row, index) => {
    const linha = index + 2;
    const codigoInterno = normalizeText(
      getByAliases(row, ["codigo", "n patrimonio", "num patrimonio", "numero patrimonio", "patrimonio"]),
    );
    const descricao = normalizeText(getByAliases(row, ["descricao", "bem", "item"]));
    const categoria = normalizeText(getByAliases(row, ["grupo", "categoria", "tipo"])) || "Outros";
    const casaId =
      lookupCasaId(getByAliases(row, ["casa", "local", "codigo siga", "casa de oracao"]), casas) ?? selectedCasa.id;

    const motivos: string[] = [];
    if (!codigoInterno) motivos.push("Código/Nº Patrimônio vazio");
    if (!descricao) motivos.push("Descrição vazia");
    if (!casaId) motivos.push("Casa de Oração não identificada");

    if (motivos.length > 0) {
      erros.push({ linha, motivo: motivos.join("; ") });
      return;
    }

    validas.push({
      codigoInterno,
      descricao,
      categoria,
      marca: normalizeText(getByAliases(row, ["marca"])) || null,
      modelo: normalizeText(getByAliases(row, ["modelo"])) || null,
      numeroSerie: normalizeText(getByAliases(row, ["n serie", "numero serie", "serie"])) || null,
      dataAquisicao: normalizeDate(getByAliases(row, ["data aquisicao", "dt aquisicao", "aquisicao"])),
      valorAquisicao: normalizeMoney(getByAliases(row, ["valor", "vl aquisicao", "valor aquisicao"])),
      estadoConservacao: normalizeEstado(getByAliases(row, ["conservacao", "estado", "situacao"])),
      casaOracaoId: casaId,
      observacoes: normalizeText(getByAliases(row, ["observacoes", "observacao", "obs"])) || null,
    });
  });

  return { validas, erros };
}

function dateFromString(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validarLinhaImportacao(linha: BemImportInput, linhaNumero: number, casasValidas: Set<string>, casaFallback: string) {
  const erros: string[] = [];
  const codigoInterno = normalizeText(linha.codigoInterno);
  const descricao = normalizeText(linha.descricao);
  const categoria = normalizeText(linha.categoria);
  const observacoes = normalizeText(linha.observacoes);
  const casaOracaoId = linha.casaOracaoId && casasValidas.has(linha.casaOracaoId) ? linha.casaOracaoId : casaFallback;

  if (!codigoInterno) erros.push("Código/Nº Patrimônio vazio");
  if (codigoInterno.length > 50) erros.push("Código/Nº Patrimônio maior que 50 caracteres");
  if (!descricao) erros.push("Descrição vazia");
  if (descricao.length > 500) erros.push("Descrição maior que 500 caracteres");
  if (!CATEGORIAS.includes(categoria as (typeof CATEGORIAS)[number])) erros.push("Categoria inválida");
  if (!ESTADOS.includes(linha.estadoConservacao)) erros.push("Estado de conservação inválido");
  if (observacoes.length > 1000) erros.push("Observações maior que 1000 caracteres");

  if (erros.length > 0) {
    return {
      erro: { linha: linhaNumero, motivo: erros.join("; ") } satisfies ImportacaoErro,
      linha: null,
    };
  }

  return {
    erro: null,
    linha: {
      ...linha,
      codigoInterno,
      descricao,
      categoria,
      observacoes: observacoes || null,
      casaOracaoId,
    },
  };
}

export async function confirmarImportacao(linhas: BemImportInput[], casaOracaoId: string) {
  const profile = await requireGestorForAction();
  const casas = await prisma.casaOracao.findMany({
    where: { administracaoId: profile.administracaoId, ativa: true },
    select: { id: true },
  });
  const casasValidas = new Set(casas.map((casa) => casa.id));

  if (!casasValidas.has(casaOracaoId)) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }

  let importados = 0;
  let atualizados = 0;
  let ignorados = 0;
  const erros: ImportacaoErro[] = [];
  const linhasValidas = linhas.slice(0, MAX_ROWS).flatMap((linha, index) => {
    const result = validarLinhaImportacao(linha, index + 1, casasValidas, casaOracaoId);
    if (result.erro) {
      erros.push(result.erro);
      ignorados += 1;
      return [];
    }

    return [result.linha];
  });

  await prisma.$transaction(async (tx) => {
    const existentes = await tx.bemPatrimonial.findMany({
      where: {
        administracaoId: profile.administracaoId,
        codigoInterno: { in: linhasValidas.map((linha) => linha.codigoInterno) },
      },
      select: { codigoInterno: true, ativo: true },
    });
    const existentesPorCodigo = new Map(existentes.map((bem) => [bem.codigoInterno, bem]));

    for (const linha of linhasValidas) {
      const existing = existentesPorCodigo.get(linha.codigoInterno);

      const data: Prisma.BemPatrimonialUncheckedCreateInput = {
        administracaoId: profile.administracaoId,
        casaOracaoId: linha.casaOracaoId ?? casaOracaoId,
        codigoInterno: linha.codigoInterno,
        descricao: linha.descricao,
        categoria: linha.categoria,
        marca: linha.marca || null,
        modelo: linha.modelo || null,
        numeroSerie: linha.numeroSerie || null,
        dataAquisicao: dateFromString(linha.dataAquisicao),
        valorAquisicao: linha.valorAquisicao || null,
        estadoConservacao: linha.estadoConservacao,
        observacoes: linha.observacoes || null,
        ativo: true,
        registradoPorId: profile.id,
      };

      await tx.bemPatrimonial.upsert({
        where: {
          administracaoId_codigoInterno: {
            administracaoId: profile.administracaoId,
            codigoInterno: linha.codigoInterno,
          },
        },
        create: data,
        update: {
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
          ativo: true,
          registradoPorId: profile.id,
        },
      });

      if (existing) {
        atualizados += 1;
      } else {
        importados += 1;
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "bem_patrimonial.import_siga",
      entity: "BemPatrimonial",
      metadata: { importados, atualizados, ignorados, erros: erros.length },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/inventario");

  return { importados, atualizados, ignorados, erros };
}

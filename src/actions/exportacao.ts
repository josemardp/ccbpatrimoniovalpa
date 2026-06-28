import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";

type ExportFormat = "xlsx" | "csv";

type ExportFile = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

async function requireExportUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.profile.papel !== "gestor_adm") {
    throw new Error("UNAUTHORIZED");
  }

  return currentUser.profile;
}

function dataArquivo() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("pt-BR") : "";
}

function formatDecimal(value: { toString: () => string } | null) {
  return value ? value.toString() : "";
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function sanitizeSheetName(value: string) {
  const name = value.replace(/[:\\/?*[\]]/g, " ").trim();
  return (name || "Planilha").slice(0, 31);
}

function estadoLabel(value: string) {
  const labels: Record<string, string> = {
    otimo: "Ótimo",
    bom: "Bom",
    regular: "Regular",
    ruim: "Ruim",
    descartado: "Descartado",
  };

  return labels[value] ?? value;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toInventarioRow(bem: {
  codigoInterno: string;
  descricao: string;
  categoria: string;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  dataAquisicao: Date | null;
  valorAquisicao: { toString: () => string } | null;
  estadoConservacao: string;
  observacoes: string | null;
}) {
  return {
    Código: bem.codigoInterno,
    Descrição: bem.descricao,
    "Grupo/Categoria": bem.categoria,
    Marca: bem.marca ?? "",
    Modelo: bem.modelo ?? "",
    "Nº Série": bem.numeroSerie ?? "",
    "Data Aquisição": formatDate(bem.dataAquisicao),
    Valor: formatDecimal(bem.valorAquisicao),
    "Estado de Conservação": estadoLabel(bem.estadoConservacao),
    Observações: bem.observacoes ?? "",
  };
}

function workbookBuffer(workbook: XLSX.WorkBook) {
  return Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer);
}

export async function exportarInventarioCasa(casaId: string, formato: ExportFormat): Promise<ExportFile> {
  const profile = await requireExportUser();

  const casa = await prisma.casaOracao.findFirst({
    where: {
      id: casaId,
      administracaoId: profile.administracaoId,
      ativa: true,
    },
    select: { id: true, codigoSiga: true, nome: true },
  });

  if (!casa) {
    throw new Error("CASA_NOT_FOUND");
  }

  const bens = await prisma.bemPatrimonial.findMany({
    where: {
      administracaoId: profile.administracaoId,
      casaOracaoId: casa.id,
      ativo: true,
    },
    orderBy: { codigoInterno: "asc" },
  });

  const rows = bens.map(toInventarioRow);
  const filenameBase = `inventario-${sanitizeFilename(casa.codigoSiga)}-${dataArquivo()}`;

  if (formato === "csv") {
    const headers = Object.keys(toInventarioRow({
      codigoInterno: "",
      descricao: "",
      categoria: "",
      marca: null,
      modelo: null,
      numeroSerie: null,
      dataAquisicao: null,
      valorAquisicao: null,
      estadoConservacao: "",
      observacoes: null,
    }));
    const lines = [headers.join(";"), ...rows.map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(";"))];

    return {
      buffer: Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8"),
      filename: `${filenameBase}.csv`,
      contentType: CSV_CONTENT_TYPE,
    };
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(casa.codigoSiga));

  return {
    buffer: workbookBuffer(workbook),
    filename: `${filenameBase}.xlsx`,
    contentType: XLSX_CONTENT_TYPE,
  };
}

export async function exportarInventarioCompleto(formato: "xlsx"): Promise<ExportFile> {
  if (formato !== "xlsx") {
    throw new Error("INVALID_FORMAT");
  }

  const profile = await requireExportUser();
  const casas = await prisma.casaOracao.findMany({
    where: { administracaoId: profile.administracaoId, ativa: true },
    orderBy: { codigoSiga: "asc" },
    select: {
      id: true,
      codigoSiga: true,
      nome: true,
      bensPatrimoniais: {
        where: { ativo: true },
        orderBy: { codigoInterno: "asc" },
      },
    },
  });

  const workbook = XLSX.utils.book_new();
  const dataExportacao = new Date().toLocaleDateString("pt-BR");
  const resumo = casas.map((casa) => ({
    Casa: `${casa.codigoSiga} · ${casa.nome}`,
    "Total bens": casa.bensPatrimoniais.length,
    "Valor total": casa.bensPatrimoniais.reduce((sum, bem) => sum + Number(bem.valorAquisicao ?? 0), 0),
    "Data exportação": dataExportacao,
  }));

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumo), "Resumo");

  casas.forEach((casa) => {
    const rows = casa.bensPatrimoniais.map(toInventarioRow);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(casa.codigoSiga));
  });

  return {
    buffer: workbookBuffer(workbook),
    filename: `inventario-completo-${dataArquivo()}.xlsx`,
    contentType: XLSX_CONTENT_TYPE,
  };
}

export { XLSX_CONTENT_TYPE };

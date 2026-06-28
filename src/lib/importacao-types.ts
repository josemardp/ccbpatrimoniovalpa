import type { EstadoConservacao } from "@prisma/client";

export type BemImportInput = {
  codigoInterno: string;
  descricao: string;
  categoria: string;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  dataAquisicao?: string | null;
  valorAquisicao?: string | null;
  estadoConservacao: EstadoConservacao;
  casaOracaoId?: string | null;
  observacoes?: string | null;
};

export type ImportacaoErro = {
  linha: number;
  motivo: string;
};

export type ImportacaoPreview = {
  validas: BemImportInput[];
  erros: ImportacaoErro[];
};

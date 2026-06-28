export const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export const MESES_COMPLETOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const FORM_148_ETAPAS = [
  { id: "elaborado", label: "Elaborado" },
  { id: "ass_min", label: "Ass. Min" },
  { id: "ins_siga", label: "Ins. SIGA" },
  { id: "pendencias", label: "Pendências" },
  { id: "escaneado", label: "Escaneado" },
] as const;

export const CONTROLE_TAREFAS = [
  { id: "t1_checar_nf", label: "T1: Checar NF" },
  { id: "t2_inseridos_siga_148", label: "T2: Inseridos SIGA – Form. 14.8" },
  { id: "t3_insercoes", label: "T3: Inserções" },
  { id: "t4_exclusoes_baixas", label: "T4: Exclusões / Baixas" },
  { id: "t5_alocacoes", label: "T5: Alocações" },
  { id: "t6_checklist_siga", label: "T6: Check List SIGA" },
  { id: "t7_ass_cf_docs", label: "T7: Ass. CF – todos os docs" },
] as const;

export const STATUS_LABELS = {
  vazio: "—",
  ok: "✅",
  pendente: "⏳",
  nao: "❌",
  na: "N-A",
} as const;

export type StatusRotinaKey = keyof typeof STATUS_LABELS;
export type Form148EtapaKey = (typeof FORM_148_ETAPAS)[number]["id"];


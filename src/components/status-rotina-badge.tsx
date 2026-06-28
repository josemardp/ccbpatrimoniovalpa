import { STATUS_LABELS, type StatusRotinaKey } from "@/lib/sprint1";

const STATUS_TEXT = {
  vazio: "Vazio",
  ok: "OK",
  pendente: "Pendente",
  nao: "Não",
  na: "N/A",
} as const;

export function statusBadgeClass(status: StatusRotinaKey) {
  switch (status) {
    case "ok":
      return "border-green-200 bg-green-50 text-green-700";
    case "pendente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "nao":
      return "border-red-200 bg-red-50 text-red-700";
    case "na":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

export function StatusRotinaBadge({ status }: { status: StatusRotinaKey }) {
  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
    >
      {STATUS_LABELS[status]} {STATUS_TEXT[status]}
    </span>
  );
}

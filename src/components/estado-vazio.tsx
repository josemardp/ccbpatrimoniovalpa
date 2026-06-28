import type { LucideIcon } from "lucide-react";

export function EstadoVazio({
  icon: Icon,
  titulo,
  descricao,
  tone = "slate",
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  tone?: "slate" | "green";
}) {
  const colors =
    tone === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-slate-200 bg-slate-50 text-slate-500";

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{descricao}</p>
    </div>
  );
}

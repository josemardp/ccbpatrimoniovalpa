import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export function previousCompetencia(base = new Date()) {
  const date = new Date(base);
  date.setMonth(date.getMonth() - 1);
  return { ano: date.getFullYear(), mes: date.getMonth() + 1 };
}

async function countPendenciasAbertasRaw(administracaoId: string) {
  const anterior = previousCompetencia();
  const [formPendentes, controlePendentes] = await Promise.all([
    prisma.form148Status.count({
      where: {
        administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
    }),
    prisma.controleMensal.count({
      where: {
        administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
    }),
  ]);

  return formPendentes + controlePendentes;
}

export const countPendenciasAbertas = unstable_cache(countPendenciasAbertasRaw, ["pendencias-abertas"], {
  revalidate: 300,
});

export async function countPendenciasMesAnterior(administracaoId: string) {
  const anterior = previousCompetencia();
  const [formPendentes, controlePendentes] = await Promise.all([
    prisma.form148Status.count({
      where: {
        administracaoId,
        competenciaAno: anterior.ano,
        competenciaMes: anterior.mes,
        status: { in: ["pendente", "vazio"] },
      },
    }),
    prisma.controleMensal.count({
      where: {
        administracaoId,
        competenciaAno: anterior.ano,
        competenciaMes: anterior.mes,
        status: { in: ["pendente", "vazio"] },
      },
    }),
  ]);

  return formPendentes + controlePendentes;
}

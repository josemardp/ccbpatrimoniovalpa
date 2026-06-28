import { NextResponse } from "next/server";
import { montarResumoMensalHtml } from "@/lib/email";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const html = montarResumoMensalHtml({
    ano: 2026,
    mes: 6,
    appUrl: "http://localhost:3000",
    totalBensRegistrados: 42,
    form148: [
      {
        casa: "22-5262 · Central Valparaíso",
        competenciaAno: 2026,
        competenciaMes: 6,
        descricao: "Escaneado",
        status: "pendente",
      },
    ],
    controleGeral: [
      {
        competenciaAno: 2026,
        competenciaMes: 6,
        descricao: "T6: Check List SIGA",
        status: "vazio",
      },
    ],
  });

  console.log(html);

  return NextResponse.json({ ok: true, html });
}

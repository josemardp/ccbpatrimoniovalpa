import { NextRequest, NextResponse } from "next/server";
import { exportarInventarioCasa, exportarInventarioCompleto } from "@/actions/exportacao";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function downloadResponse(file: { buffer: Buffer; filename: string; contentType: string }) {
  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.profile.papel !== "gestor_adm") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const formato = params.get("formato") === "csv" ? "csv" : "xlsx";
  const completo = params.get("completo") === "true";
  const casaId = params.get("casaId");

  try {
    if (completo) {
      if (formato !== "xlsx") {
        return NextResponse.json({ error: "Exportação completa disponível apenas em .xlsx." }, { status: 400 });
      }

      return downloadResponse(await exportarInventarioCompleto("xlsx"));
    }

    if (!casaId) {
      return NextResponse.json({ error: "Informe uma Casa de Oração para exportar." }, { status: 400 });
    }

    return downloadResponse(await exportarInventarioCasa(casaId, formato));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "CASA_NOT_FOUND") {
      return NextResponse.json({ error: "Casa de Oração não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ error: "Não foi possível gerar a exportação." }, { status: 500 });
  }
}

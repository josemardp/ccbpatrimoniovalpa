import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TarefaPayload = {
  titulo?: unknown;
  descricao?: unknown;
  prazo?: unknown;
};

async function requireGestorAdmApi() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.profile.papel !== "gestor_adm") {
    return null;
  }

  return currentUser.profile;
}

function parseTitulo(value: unknown) {
  const titulo = String(value ?? "").trim();

  if (!titulo) {
    throw new Error("Título é obrigatório.");
  }

  if (titulo.length > 200) {
    throw new Error("Título deve ter no máximo 200 caracteres.");
  }

  return titulo;
}

function parseDescricao(value: unknown) {
  const descricao = String(value ?? "").trim();

  if (!descricao) {
    return null;
  }

  if (descricao.length > 1000) {
    throw new Error("Descrição deve ter no máximo 1000 caracteres.");
  }

  return descricao;
}

function parsePrazo(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Prazo inválido.");
  }

  return date;
}

export async function GET() {
  const profile = await requireGestorAdmApi();

  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tarefas = await prisma.tarefaAdm.findMany({
    where: { administracaoId: profile.administracaoId },
    orderBy: [
      { concluida: "asc" },
      { prazo: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ tarefas });
}

export async function POST(request: NextRequest) {
  const profile = await requireGestorAdmApi();

  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as TarefaPayload;
    const data: Prisma.TarefaAdmUncheckedCreateInput = {
      administracaoId: profile.administracaoId,
      titulo: parseTitulo(body.titulo),
      descricao: parseDescricao(body.descricao),
      prazo: parsePrazo(body.prazo),
      criadaPorId: profile.id,
    };

    const tarefa = await prisma.tarefaAdm.create({ data });

    await prisma.auditLog.create({
      data: {
        usuarioId: profile.id,
        administracaoId: profile.administracaoId,
        action: "tarefa_adm.create",
        entity: "TarefaAdm",
        entityId: tarefa.id,
        metadata: { titulo: tarefa.titulo, prazo: tarefa.prazo?.toISOString() ?? null },
      },
    });

    return NextResponse.json({ tarefa }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar a tarefa." },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PatchPayload = {
  titulo?: unknown;
  descricao?: unknown;
  prazo?: unknown;
  concluida?: unknown;
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

function parseConcluida(value: unknown) {
  if (typeof value !== "boolean") {
    throw new Error("Status de conclusão inválido.");
  }

  return value;
}

async function findScopedTarefa(id: string, administracaoId: string) {
  return prisma.tarefaAdm.findFirst({
    where: { id, administracaoId },
    select: { id: true, titulo: true },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const profile = await requireGestorAdmApi();

  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tarefa = await findScopedTarefa(params.id, profile.administracaoId);
  if (!tarefa) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as PatchPayload;
    const data: Prisma.TarefaAdmUpdateInput = {};

    if ("titulo" in body) {
      data.titulo = parseTitulo(body.titulo);
    }

    if ("descricao" in body) {
      data.descricao = parseDescricao(body.descricao);
    }

    if ("prazo" in body) {
      data.prazo = parsePrazo(body.prazo);
    }

    if ("concluida" in body) {
      const concluida = parseConcluida(body.concluida);
      data.concluida = concluida;
      data.concluidaEm = concluida ? new Date() : null;
    }

    const updated = await prisma.tarefaAdm.update({
      where: { id: params.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        usuarioId: profile.id,
        administracaoId: profile.administracaoId,
        action: "tarefa_adm.update",
        entity: "TarefaAdm",
        entityId: updated.id,
        metadata: {
          titulo: updated.titulo,
          concluida: updated.concluida,
          prazo: updated.prazo?.toISOString() ?? null,
        },
      },
    });

    return NextResponse.json({ tarefa: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível atualizar a tarefa." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const profile = await requireGestorAdmApi();

  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tarefa = await findScopedTarefa(params.id, profile.administracaoId);
  if (!tarefa) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  await prisma.tarefaAdm.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "tarefa_adm.delete",
      entity: "TarefaAdm",
      entityId: params.id,
      metadata: { titulo: tarefa.titulo },
    },
  });

  return NextResponse.json({ ok: true });
}

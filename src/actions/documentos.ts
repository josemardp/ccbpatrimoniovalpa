"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateForm148Status } from "@/actions/rotinas";

const BUCKET = "documentos";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem gerenciar documentos.");
  }

  return currentUser.profile;
}

function parseNumber(value: FormDataEntryValue | null, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} inválido.`);
  }

  return parsed;
}

function validateCompetencia(ano: number, mes: number) {
  if (ano < 2020 || ano > 2100) {
    throw new Error("Ano de competência inválido.");
  }

  if (mes < 1 || mes > 12) {
    throw new Error("Mês de competência inválido.");
  }
}

async function validatePdf(file: File) {
  const lowerName = file.name.toLowerCase();

  if (!lowerName.endsWith(".pdf") || file.type !== "application/pdf") {
    throw new Error("Envie apenas arquivo PDF.");
  }

  if (file.size <= 0) {
    throw new Error("Arquivo vazio.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo maior que 10 MB.");
  }

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2d;
  if (!isPdf) {
    throw new Error("Arquivo inválido. O conteúdo não parece ser PDF.");
  }
}

export async function uploadDocumento(formData: FormData) {
  const profile = await requireGestorForAction();
  const casaId = String(formData.get("casaId") ?? "");
  const ano = parseNumber(formData.get("ano"), "Ano");
  const mes = parseNumber(formData.get("mes"), "Mês");
  const tipo = String(formData.get("tipo") ?? "form148");
  const arquivo = formData.get("arquivo");

  validateCompetencia(ano, mes);

  if (!(arquivo instanceof File)) {
    throw new Error("Arquivo PDF obrigatório.");
  }

  await validatePdf(arquivo);

  const casa = await prisma.casaOracao.findFirst({
    where: { id: casaId, administracaoId: profile.administracaoId, ativa: true },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }

  const storagePath = `${profile.administracaoId}/${casaId}/${ano}-${String(mes).padStart(2, "0")}/${randomUUID()}.pdf`;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, arquivo, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new Error(`Falha ao enviar documento: ${error.message}`);
  }

  const documento = await prisma.documento.create({
    data: {
      administracaoId: profile.administracaoId,
      casaOracaoId: casaId,
      competenciaAno: ano,
      competenciaMes: mes,
      tipo,
      storagePath,
      nomeOriginal: arquivo.name,
      tamanhoBytes: arquivo.size,
      uploadadoPorId: profile.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "documento.upload",
      entity: "Documento",
      entityId: documento.id,
      metadata: {
        casaId,
        ano,
        mes,
        tipo,
        storagePath,
        nomeOriginal: arquivo.name,
        tamanhoBytes: arquivo.size,
      },
    },
  });

  if (tipo === "form148") {
    await updateForm148Status(casaId, ano, mes, "escaneado", "ok");
  }

  revalidatePath("/formularios");
  revalidatePath(`/formularios/${casaId}`);
}

export async function listDocumentos(casaId: string, ano: number, mes: number) {
  const profile = await requireGestorForAction();
  validateCompetencia(ano, mes);

  return prisma.documento.findMany({
    where: {
      administracaoId: profile.administracaoId,
      casaOracaoId: casaId,
      competenciaAno: ano,
      competenciaMes: mes,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      storagePath: true,
      nomeOriginal: true,
      tamanhoBytes: true,
      createdAt: true,
      uploadadoPor: { select: { nome: true, email: true } },
    },
  });
}

export async function getDocumentoUrl(storagePath: string) {
  const profile = await requireGestorForAction();
  const documento = await prisma.documento.findFirst({
    where: { administracaoId: profile.administracaoId, storagePath },
    select: { storagePath: true },
  });

  if (!documento) {
    throw new Error("Documento inválido para esta Administração.");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(documento.storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL assinada: ${error?.message ?? "sem URL"}`);
  }

  return data.signedUrl;
}

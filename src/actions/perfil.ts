"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem alterar o perfil.");
  }

  return currentUser.profile;
}

export async function atualizarPerfil(nome: string) {
  const profile = await requireGestorForAction();
  const parsedName = nome.trim();

  if (parsedName.length < 3) {
    return { ok: false, message: "Informe um nome com pelo menos 3 caracteres." };
  }

  await prisma.usuario.update({
    where: { id: profile.id },
    data: { nome: parsedName },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "update",
      entity: "usuario",
      entityId: profile.id,
      metadata: { descricao: "Nome do perfil atualizado", nome: parsedName },
    },
  });

  revalidatePath("/perfil");
  return { ok: true, message: "Perfil atualizado com sucesso." };
}

export async function alterarSenha(novaSenha: string) {
  const profile = await requireGestorForAction();

  if (novaSenha.length < 8) {
    return { ok: false, message: "A nova senha deve ter pelo menos 8 caracteres." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    return { ok: false, message: "Não foi possível alterar a senha. Faça login novamente e tente outra vez." };
  }

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "password_change",
      entity: "usuario",
      entityId: profile.id,
      metadata: { descricao: "Senha alterada pelo usuário" },
    },
  });

  revalidatePath("/perfil");
  return { ok: true, message: "Senha alterada com sucesso." };
}

export async function encerrarSessao() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function encerrarTodasSessoes() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

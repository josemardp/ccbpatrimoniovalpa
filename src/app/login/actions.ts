"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/login?error=invalid");
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo || usuario.papel !== "gestor_adm") {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      authUserId: usuario.authUserId ?? data.user.id,
      lastLoginAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: usuario.id,
      administracaoId: usuario.administracaoId,
      action: "auth.sign_in",
      entity: "Usuario",
      entityId: usuario.id,
      ip: headers().get("x-forwarded-for"),
      metadata: { email },
    },
  });

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

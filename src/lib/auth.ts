import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  await prisma.usuario.updateMany({
    where: {
      email: user.email,
      authUserId: null,
      ativo: true,
    },
    data: {
      authUserId: user.id,
      lastLoginAt: new Date(),
    },
  });

  const profile = await prisma.usuario.findFirst({
    where: {
      ativo: true,
      OR: [{ authUserId: user.id }, { email: user.email }],
    },
    include: {
      administracao: true,
      casaOracao: true,
    },
  });

  return profile ? { authUser: user, profile } : null;
}

export async function requireGestorAdm() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    redirect("/login?error=unauthorized");
  }

  return currentUser;
}

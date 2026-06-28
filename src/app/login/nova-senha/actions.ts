"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function atualizarSenha(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirect("/login/nova-senha?status=short");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/login/nova-senha?status=error");
  }

  redirect("/login?status=password-updated");
}

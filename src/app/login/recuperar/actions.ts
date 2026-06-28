"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function solicitarRecuperacao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/login/recuperar?status=missing");
  }

  if (!checkRateLimit(`password-reset:${email}`, 3, 60 * 60 * 1000)) {
    redirect("/login/recuperar?status=rate_limit");
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login/nova-senha`,
  });

  if (error) {
    redirect("/login/recuperar?status=error");
  }

  redirect("/login/recuperar?status=sent");
}

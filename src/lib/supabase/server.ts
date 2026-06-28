import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function secureCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, secureCookieOptions(options));
            });
          } catch {
            // Server Components cannot set cookies. Middleware/server actions handle refreshes.
          }
        },
      },
    },
  );
}

import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell userEmail={profile.email} userName={profile.nome}>
      {children}
    </AppShell>
  );
}

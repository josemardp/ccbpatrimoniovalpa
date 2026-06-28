import { AppShellClient } from "@/components/app-shell-client";
import { signOut } from "@/app/login/actions";

export function AppShell({
  children,
  userName,
  userEmail,
  title = "CCB Patrimônio",
  subtitle = "Gestão de Patrimônio — Bens Móveis",
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <AppShellClient
      signOutAction={signOut}
      subtitle={subtitle}
      title={title}
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </AppShellClient>
  );
}

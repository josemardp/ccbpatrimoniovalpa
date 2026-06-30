import { AppShellClient } from "@/components/app-shell-client";
import { signOut } from "@/app/login/actions";
import { countPendenciasAbertas } from "@/lib/pendencias";
import { prisma } from "@/lib/prisma";

export async function AppShell({
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
  const usuario = await prisma.usuario.findUnique({
    where: { email: userEmail },
    select: { administracaoId: true },
  });
  const [pendenciasCount, tarefasCount] = usuario
    ? await Promise.all([
        countPendenciasAbertas(usuario.administracaoId),
        prisma.tarefaAdm.count({
          where: {
            administracaoId: usuario.administracaoId,
            concluida: false,
          },
        }),
      ])
    : [0, 0];

  return (
    <AppShellClient
      pendenciasCount={pendenciasCount}
      signOutAction={signOut}
      subtitle={subtitle}
      tarefasCount={tarefasCount}
      title={title}
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </AppShellClient>
  );
}

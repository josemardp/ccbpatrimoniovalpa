import { AppShell } from "@/components/app-shell";
import { Sprint1Dashboard } from "@/components/sprint1-dashboard";
import { requireGestorAdm } from "@/lib/auth";
import { getSprint1Data } from "./actions";

export default async function DashboardPage() {
  const { profile } = await requireGestorAdm();
  const now = new Date();
  const initialYear = now.getFullYear();
  const initialMonth = now.getMonth() + 1;
  const initialData = await getSprint1Data(initialYear, initialMonth);

  return (
    <AppShell
      subtitle="Dashboard"
      title="Painel do Gestor"
      userEmail={profile.email}
      userName={profile.nome}
    >
      <Sprint1Dashboard initialData={initialData} initialMonth={initialMonth} initialYear={initialYear} />
    </AppShell>
  );
}

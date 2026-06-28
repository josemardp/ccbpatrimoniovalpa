import { AppShell } from "@/components/app-shell";
import { Sprint1Dashboard } from "@/components/sprint1-dashboard";
import { requireGestorAdm } from "@/lib/auth";
import { getSprint1Data } from "@/app/(app)/dashboard/actions";

export default async function RotinasPage() {
  const { profile } = await requireGestorAdm();
  const now = new Date();
  const initialYear = now.getFullYear();
  const initialMonth = now.getMonth() + 1;
  const initialData = await getSprint1Data(initialYear, initialMonth);

  return (
    <AppShell
      subtitle="Rotinas Mensais"
      title="Controle Geral e Form. 14.8"
      userEmail={profile.email}
      userName={profile.nome}
    >
      <Sprint1Dashboard initialData={initialData} initialMonth={initialMonth} initialYear={initialYear} />
    </AppShell>
  );
}

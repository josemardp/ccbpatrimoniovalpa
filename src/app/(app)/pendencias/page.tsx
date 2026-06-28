import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function PendenciasPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Pendências" title="Pendências e Acompanhamento" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Pendências" description="Gestão centralizada de pendências será implementada em sprint própria do MVP." />
    </AppShell>
  );
}

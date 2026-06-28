import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function FormulariosPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Formulários" title="Gerador de Formulários" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Formulários" description="Geração dos formulários oficiais da Seção 14 será implementada na Sprint 3." />
    </AppShell>
  );
}

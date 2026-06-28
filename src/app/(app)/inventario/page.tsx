import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function InventarioPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Inventário" title="Inventário Anual" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Inventário" description="Inventário anual respeitará o app oficial CCB; exportação para ele está planejada para a Sprint 12." />
    </AppShell>
  );
}

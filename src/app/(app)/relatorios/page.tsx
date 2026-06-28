import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function RelatoriosPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Relatórios" title="Relatórios" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Relatórios" description="Relatórios e exportações serão implementados após a fundação de dados do MVP." />
    </AppShell>
  );
}

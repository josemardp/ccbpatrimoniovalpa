import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function ChecklistPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Checklist" title="Checklist SIGA" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Checklist SIGA" description="Checklist VER00808 guiado será implementado na Sprint 4." />
    </AppShell>
  );
}

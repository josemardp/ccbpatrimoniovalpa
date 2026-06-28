import { ModulePlaceholder } from "@/components/module-placeholder";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function MovimentosPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Movimentos" title="Bens e Movimentações" userEmail={profile.email} userName={profile.nome}>
      <ModulePlaceholder title="Movimentos" description="Cadastro de bens, movimentações e NFs aguardando cadastro será implementado na Sprint 2." />
    </AppShell>
  );
}

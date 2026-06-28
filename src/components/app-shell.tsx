import Link from "next/link";
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  FileText,
  Home,
  ListChecks,
  Package,
  ScrollText,
  UserRound,
  Warehouse,
} from "lucide-react";
import { signOut } from "@/app/login/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/rotinas", label: "Rotinas", icon: ListChecks },
  { href: "/movimentos", label: "Movimentos", icon: Package },
  { href: "/formularios", label: "Formulários", icon: FileText },
  { href: "/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/pendencias", label: "Pendências", icon: Bell },
  { href: "/inventario", label: "Inventário", icon: Warehouse },
  { href: "/relatorios", label: "Relatórios", icon: ScrollText },
];

export function AppShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link className="flex items-center gap-3" href="/dashboard">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600">
              <Home className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold">CCB Patrimônio</div>
              <div className="text-xs text-slate-400">Adm. Valparaíso/SP</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sprint 0</p>
              <h1 className="text-lg font-semibold text-slate-950">Fundação do sistema</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:flex"
                href="/perfil"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span>{userName}</span>
              </Link>
              <form action={signOut}>
                <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  Sair
                </button>
              </form>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <Link
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
        <footer className="px-4 pb-6 text-xs text-slate-500 lg:px-8">
          Sessão: {userEmail} · Perfil ativo: gestor_adm
        </footer>
      </div>
    </div>
  );
}

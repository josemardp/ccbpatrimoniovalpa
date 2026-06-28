"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  ListChecks,
  Menu,
  Package,
  ScrollText,
  UserRound,
  Warehouse,
} from "lucide-react";

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

export function AppShellClient({
  children,
  userName,
  userEmail,
  title,
  subtitle,
  signOutAction,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  title: string;
  subtitle: string;
  signOutAction: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("ccb.sidebar.collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("ccb.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-slate-950 text-white transition-all duration-200 lg:flex lg:flex-col ${
          collapsed ? "w-20" : "w-64"
        }`}
        data-print-hide
      >
        <div className={`border-b border-white/10 py-5 ${collapsed ? "px-3" : "px-5"}`}>
          <div className="flex items-center justify-between gap-2">
            <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-blue-600">
                <Home className="h-5 w-5" aria-hidden="true" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">CCB Patrimônio</div>
                  <div className="truncate text-xs text-slate-400">Adm. Valparaíso/SP</div>
                </div>
              ) : null}
            </Link>
            <button
              aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              className="hidden rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:inline-flex"
              onClick={toggleCollapsed}
              type="button"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white ${
                  collapsed ? "justify-center" : "gap-3"
                }`}
                href={item.href}
                key={item.href}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur" data-print-hide>
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Menu className="h-5 w-5 flex-shrink-0 text-slate-400 lg:hidden" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{subtitle}</p>
                <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:flex"
                href="/perfil"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span>{userName}</span>
              </Link>
              <form action={signOutAction}>
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
        <footer className="px-4 pb-6 text-xs text-slate-500 lg:px-8" data-print-hide>
          Sessão: {userEmail} · Perfil ativo: gestor_adm
        </footer>
      </div>
    </div>
  );
}

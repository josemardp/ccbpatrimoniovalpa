"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { useEffect, useState, type MouseEvent } from "react";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Home,
  ListChecks,
  Menu,
  Package,
  ScrollText,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/rotinas", label: "Rotinas", icon: ListChecks },
  { href: "/movimentos", label: "Movimentos", icon: Package },
  { href: "/formularios", label: "Formulários", icon: FileText },
  { href: "/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/pendencias", label: "Pendências", icon: Bell },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList },
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
  pendenciasCount,
  tarefasCount,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  title: string;
  subtitle: string;
  signOutAction: () => Promise<void>;
  pendenciasCount: number;
  tarefasCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("ccb.sidebar.collapsed") === "1");
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("ccb.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  function handleDesktopNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    router.push(href);
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
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badgeCount = item.href === "/pendencias" ? pendenciasCount : item.href === "/tarefas" ? tarefasCount : 0;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-white ${
                  active ? "bg-white/10 text-white" : "text-slate-300"
                } ${
                  collapsed ? "justify-center" : "gap-3"
                } relative`}
                href={item.href}
                key={item.href}
                onClick={(event) => handleDesktopNavigation(event, item.href)}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 ? (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {badgeCount}
                      </span>
                    ) : null}
                  </>
                ) : badgeCount > 0 ? (
                  <span className="absolute ml-5 mt-[-18px] rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur" data-print-hide>
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Abrir menu"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{subtitle}</p>
                <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <InstallAppButton />
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
          <div className="hidden">
            {navItems.map((item) => (
              <Link
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
                {(item.href === "/pendencias" ? pendenciasCount : item.href === "/tarefas" ? tarefasCount : 0) > 0 ? (
                  <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {item.href === "/pendencias" ? pendenciasCount : tarefasCount}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-slate-950/50"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-950 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div>
                  <h2 className="text-sm font-semibold" id="mobile-menu-title">CCB Patrimônio</h2>
                  <p className="text-xs text-slate-400">Adm. Valparaíso/SP</p>
                </div>
                <button
                  aria-label="Fechar menu"
                  className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const badgeCount = item.href === "/pendencias" ? pendenciasCount : item.href === "/tarefas" ? tarefasCount : 0;
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                        active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 ? (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}
        <main className="px-4 py-6 lg:px-8">{children}</main>
        <footer className="px-4 pb-6 text-xs text-slate-500 lg:px-8" data-print-hide>
          Sessão: {userEmail} · Perfil ativo: gestor_adm
        </footer>
      </div>
    </div>
  );
}

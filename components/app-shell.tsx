import type { ReactNode } from "react";
import Link from "next/link";
import { FormsIcon, LogoMark, SettingsIcon, UsersIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceAssistant } from "@/components/workspace-assistant";

type AppShellProps = {
  user: { name: string; email: string; role: string };
  active: "forms" | "accounts" | "account";
  children: ReactNode;
};

function navClass(active: boolean): string {
  return `inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${active
    ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/80"
    : "text-slate-500 hover:bg-white/80 hover:text-slate-900"}`;
}

export function AppShell({ user, active, children }: AppShellProps) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase()).join("") || "U";

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/forms" className="flex items-center gap-2.5 text-slate-900">
            <LogoMark className="shadow-[0_5px_14px_rgba(166,75,45,.24)]" />
            <span className="text-lg font-bold tracking-tight">Formyst</span>
          </Link>

          <nav aria-label="Workspace" className="order-3 flex w-full items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/75 p-1 sm:order-none sm:w-auto">
            <Link href="/forms" aria-current={active === "forms" ? "page" : undefined} className={navClass(active === "forms")}>
              <FormsIcon className="h-4 w-4" /> Forms
            </Link>
            {user.role === "admin" ? (
              <Link href="/accounts" aria-current={active === "accounts" ? "page" : undefined} className={navClass(active === "accounts")}>
                <UsersIcon className="h-4 w-4" /> Accounts
              </Link>
            ) : null}
            <Link href="/account" aria-current={active === "account" ? "page" : undefined} className={navClass(active === "account")}>
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</span>
            <div className="hidden min-w-0 leading-tight lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="max-w-40 truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
      {active === "forms" ? <WorkspaceAssistant /> : null}
    </div>
  );
}

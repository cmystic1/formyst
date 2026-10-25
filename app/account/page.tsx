import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { PasswordPanel } from "@/components/password-panel";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Settings | Formyst" };
export const instant = false;

export default async function AccountPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user} active="account">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/80 px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,.04)] sm:px-9 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-600">Personal workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your account, your settings.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Manage your profile and keep your sign-in details up to date.
            </p>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[.82fr_1.18fr]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,.035)]">
              <div className="h-20 bg-gradient-to-r from-brand-600 via-violet-500 to-sky-400" />
              <div className="px-5 pb-5">
                <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-slate-950 text-base font-bold text-white shadow-sm">
                  {user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U"}
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-950">{user.name}</h2>
                <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">{user.role}</span>
                  <span className="text-xs text-slate-500">Private Formyst workspace</span>
                </div>
              </div>
            </section>

            <aside className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm" aria-hidden="true">✓</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your workspace is private</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Your forms and responses belong to your account. Admins manage workspace access.</p>
                </div>
              </div>
            </aside>
          </div>
          <PasswordPanel />
        </div>
      </div>
    </AppShell>
  );
}

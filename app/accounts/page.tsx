import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { UserManager } from "@/components/user-manager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Accounts | Formyst" };
export const instant = false;

export default async function AccountsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/forms");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppShell user={user} active="accounts">
      <div className="space-y-7">
        <section className="relative flex flex-wrap items-end justify-between gap-5 overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/80 px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,.04)] sm:px-9 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-600">Admin workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Give everyone their own space.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Create accounts for your team. Each member gets a private home for their forms and responses.
            </p>
          </div>
          <div className="relative rounded-2xl border border-white bg-white/80 px-5 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team accounts</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{users.length}</p>
          </div>
        </section>
        <UserManager users={users} />
      </div>
    </AppShell>
  );
}

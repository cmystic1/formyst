import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { FormListActions } from "@/components/form-list-actions";
import { FormLibrary } from "@/components/form-library";
import { PlusIcon } from "@/components/icons";
import { buttonSecondary } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listForms } from "@/lib/store";

export const metadata = { title: "Your forms | Formyst" };
export const instant = false;

export default async function HomePage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [forms, accountCount] = await Promise.all([
    listForms(user.id),
    user.role === "admin" ? prisma.user.count() : Promise.resolve(0),
  ]);
  const publishedCount = forms.filter((form) => form.published).length;
  const draftCount = forms.length - publishedCount;
  const responseCount = forms.reduce((sum, form) => sum + form._count.submissions, 0);
  const newResponseCount = forms.reduce((sum, form) => sum + form.newResponses, 0);
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const libraryForms = forms.map((form) => ({
    id: form.id,
    title: form.title,
    published: form.published,
    edited: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(form.updatedAt),
    responses: form._count.submissions,
    newResponses: form.newResponses,
  }));

  return (
    <AppShell user={user} active="forms">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-[0_18px_40px_rgba(15,23,42,.12)] sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-36 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-300">Welcome back, {firstName}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make every response count.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Create a form, make it your own, and share it with the people you want to hear from.
              </p>
            </div>
            <FormListActions />
          </div>
        </section>

        <section aria-label="Workspace overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "All forms", value: forms.length, detail: "In your workspace", tone: "indigo" },
            { label: "Published", value: publishedCount, detail: "Accepting responses", tone: "emerald" },
            { label: "Drafts", value: draftCount, detail: "Ready when you are", tone: "amber" },
            { label: "Responses", value: responseCount, detail: "Across your forms", tone: "sky" },
          ].map((item) => (
            <div key={item.label} className="group rounded-[20px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,.03)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,.07)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{item.label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${item.tone === "indigo" ? "bg-brand-500" : item.tone === "emerald" ? "bg-emerald-500" : item.tone === "amber" ? "bg-amber-500" : "bg-sky-500"}`} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
                {item.label === "Responses" && newResponseCount > 0 ? (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${newResponseCount} new responses`}>
                    {newResponseCount} new
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </section>

        {user.role === "admin" ? (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-brand-100 bg-brand-50/70 p-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-brand-600">Team access</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Give someone their own workspace</h2>
              <p className="mt-1 text-sm text-slate-600">
                {accountCount} account{accountCount === 1 ? "" : "s"} so far. Each person sees only the forms and responses they own.
              </p>
            </div>
            <Link href="/accounts" className={buttonSecondary}>
              <PlusIcon className="h-4 w-4" />
              Create account
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="forms-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-brand-600">Workspace library</p>
              <h2 id="forms-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Your forms</h2>
              <p className="mt-1 text-sm text-slate-500">Search, edit, and keep track of every form you own.</p>
            </div>
          </div>
          <FormLibrary forms={libraryForms} />
        </section>
      </div>
    </AppShell>
  );
}

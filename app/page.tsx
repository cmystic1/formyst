import Link from "next/link";
import { connection } from "next/server";
import { LogoMark, SparklesIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Formyst | Forms that feel like yours",
  description: "Build custom forms, share them anywhere, and keep every response in your own workspace.",
};
export const instant = false;

const features = [
  {
    number: "01",
    title: "Design it your way",
    description: "Choose colors, backgrounds, field styles, button sizes, and custom CSS. See changes as you make them.",
    mark: "✳",
  },
  {
    number: "02",
    title: "Collect every answer",
    description: "Publish a shareable form link and review responses together, with export tools when you need them.",
    mark: "↗",
  },
  {
    number: "03",
    title: "Keep work private",
    description: "Give each person an account with a private workspace for their forms and responses.",
    mark: "⌂",
  },
];

export default async function HomePage() {
  await connection();
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9fc] text-slate-950">
      <header className="relative z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Formyst home">
            <LogoMark className="shadow-[0_5px_14px_rgba(166,75,45,.24)]" />
            <span className="text-xl font-bold tracking-tight">Formyst</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
            <Link href={user ? "/forms" : "/login"} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              {user ? "My forms" : "Sign in"}
            </Link>
            <Link href={user ? "/forms" : "/signup"} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500">
              {user ? "Open workspace" : "Create your account"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(199,210,254,.6),transparent_65%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pt-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
              <SparklesIcon className="h-4 w-4" />
              A more personal way to collect responses
            </div>
            <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-[1.04] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-[4.5rem]">
              Good questions deserve <span className="text-brand-600">better forms.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Create a form that looks like it belongs to you. Customize every detail, share one simple link, and keep responses organized in your own workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={user ? "/forms" : "/signup"} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(166,75,45,.24)] transition hover:-translate-y-0.5 hover:bg-brand-500">
                {user ? "Go to my forms" : "Build your first form"}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="#features" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950">
                Explore Formyst
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Private workspaces</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Live preview</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Your own form link</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-brand-200/50 via-sky-100/30 to-fuchsia-100/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(30,41,59,.14)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-400">formyst / feedback</span>
                <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-[10px] font-bold text-brand-700">Preview</span>
              </div>
              <div className="bg-gradient-to-b from-brand-50/70 to-white px-5 py-8 sm:px-9 sm:py-10">
                <div className="mx-auto max-w-sm rounded-[22px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-8">
                  <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-brand-700">Quick feedback</span>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Tell us what you think</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-500">A few quick questions help us make things better.</p>
                  <div className="mt-6 space-y-4">
                    <div><p className="mb-1.5 text-xs font-semibold text-slate-700">Your name</p><div className="h-10 rounded-lg border border-slate-200 bg-white" /></div>
                    <div><p className="mb-1.5 text-xs font-semibold text-slate-700">How was your experience?</p><div className="flex gap-2"><span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[10px] font-semibold text-brand-700">Great</span><span className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-500">Good</span><span className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-500">Okay</span></div></div>
                    <div><p className="mb-1.5 text-xs font-semibold text-slate-700">Anything else?</p><div className="h-20 rounded-lg border border-slate-200 bg-white" /></div>
                    <div className="flex justify-end pt-1"><span className="rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm">Send feedback</span></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 text-[10px] font-medium text-slate-500">
                <span>Desktop preview</span><span>Changes appear as you design</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-lg sm:block">
              <p className="text-[10px] font-semibold text-slate-500">Responses collected</p>
              <p className="mt-1 text-lg font-bold text-slate-950">+128 <span className="text-xs font-semibold text-emerald-600">this week</span></p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200/70 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.17em] text-brand-600">Made to be yours</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everything you need to ask, share, and learn.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="group rounded-[22px] border border-slate-200/80 bg-[#fbfcff] p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,.07)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-xl font-semibold text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">{feature.mark}</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">{feature.number}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-slate-950 p-7 text-white shadow-[0_18px_50px_rgba(15,23,42,.14)] sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-300">Start with one question</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Your next form can be ready in minutes.</h2>
            <p className="mt-2 text-sm text-slate-300">Make it yours, then share it when you’re ready.</p>
          </div>
          <Link href={user ? "/forms" : "/signup"} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-brand-50">
            {user ? "Open workspace" : "Create free account"}<span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Formyst</span>
          <span>Forms that feel like yours.</span>
        </div>
      </footer>
    </main>
  );
}

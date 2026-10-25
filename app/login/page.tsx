import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google-auth";
import Link from "next/link";

export const metadata = { title: "Sign in | Formyst" };

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  await connection();
  const params = await searchParams;
  const databaseConfigured = process.env.DATABASE_URL?.startsWith("mysql://") ?? false;
  if (databaseConfigured && await getCurrentUser()) redirect("/forms");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex xl:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-72 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3 text-lg font-bold tracking-tight"><LogoMark /> Formyst</div>
        <div className="relative max-w-xl pb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-300">Your forms, your space</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Make it easy to ask. Make every answer useful.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Design forms that match your brand, share them anywhere, and keep every response organized in one place.
          </p>
          <div className="mt-10 max-w-md rounded-[22px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Your next form</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Ready to share</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-11 rounded-xl border border-white/15 bg-white/10" />
              <div className="h-11 rounded-xl border border-white/15 bg-white/10" />
              <div className="h-20 rounded-xl border border-white/15 bg-white/10" />
              <div className="h-10 w-32 rounded-xl bg-brand-500" />
            </div>
          </div>
        </div>
        <p className="relative text-xs text-slate-400">Private workspaces for every account.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-[26px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,.07)] sm:p-9">
            {databaseConfigured ? <LoginForm googleEnabled={googleConfigured()} googleError={params.google} /> : (
              <div className="space-y-3">
                <h1 className="text-xl font-bold text-slate-950">Formyst setup is incomplete</h1>
                <p className="text-sm leading-6 text-slate-600">Configure the MySQL connection and create the first administrator account before signing in.</p>
              </div>
            )}
          </div>
          <p className="mt-5 text-center text-sm text-slate-500">New to Formyst? <Link className="font-semibold text-brand-600 hover:text-brand-500" href="/signup">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}

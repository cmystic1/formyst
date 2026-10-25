import Link from "next/link";
import { connection } from "next/server";
import { LogoMark } from "@/components/icons";
import { SignupForm } from "@/components/signup-form";
import { getCurrentUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create account | Formyst" };
export const instant = false;

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  await connection();
  if (process.env.DATABASE_URL?.startsWith("mysql://") && await getCurrentUser()) redirect("/forms");
  const params = await searchParams;
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex xl:px-20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="relative flex items-center gap-3 text-lg font-bold tracking-tight"><LogoMark /> Formyst</div>
      <div className="relative max-w-xl pb-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-300">Your forms, your space</p><h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Build forms that feel like yours.</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-300">Every account gets a private workspace for forms, responses, and settings.</p></div>
      <p className="relative text-xs text-slate-400">Private workspaces for every account.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-12 sm:px-8"><div className="w-full max-w-md"><div className="rounded-[26px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,.07)] sm:p-9"><SignupForm googleEnabled={googleConfigured()} googleError={params.google} /></div><p className="mt-5 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-brand-600 hover:text-brand-500" href="/login">Sign in</Link></p></div></section>
  </main>;
}

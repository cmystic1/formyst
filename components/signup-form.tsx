"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogoMark, SpinnerIcon } from "@/components/icons";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { buttonPrimary, inputClass, labelClass } from "@/components/ui";

export function SignupForm({ googleEnabled, googleError }: { googleEnabled: boolean; googleError?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(googleError === "setup" ? "Google sign-in needs to be configured by the site administrator." : googleError ? "Google sign-in could not be completed. Please try again." : null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, password, confirmPassword }) });
      if (response.ok) { router.replace("/forms"); router.refresh(); return; }
      const data = await response.json().catch(() => null) as { error?: string } | null;
      setError(data?.error ?? "Could not create your account. Please try again.");
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <div className="space-y-5">
    <div><LogoMark /><h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Create your account</h1><p className="mt-1 text-sm text-slate-500">Start building forms in your private workspace.</p></div>
    <GoogleSignInButton enabled={googleEnabled} source="signup" />
    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or sign up with email</span></div></div>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label htmlFor="name" className={labelClass}>Name</label><input id="name" required maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>
      <div><label htmlFor="signup-email" className={labelClass}>Email</label><input id="signup-email" type="email" required maxLength={191} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></div>
      <div><label htmlFor="signup-password" className={labelClass}>Password</label><input id="signup-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /><p className="mt-1 text-xs text-slate-500">Use at least 12 characters.</p></div>
      <div><label htmlFor="confirm-password" className={labelClass}>Confirm password</label><input id="confirm-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} /></div>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={submitting} className={`${buttonPrimary} w-full`}>{submitting ? <SpinnerIcon className="h-4 w-4" /> : null}{submitting ? "Creating account…" : "Create account"}</button>
    </form>
  </div>;
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogoMark, SpinnerIcon } from "@/components/icons";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { buttonPrimary, inputClass, labelClass } from "@/components/ui";

export function LoginForm({ googleEnabled, googleError }: { googleEnabled: boolean; googleError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(googleError === "setup" ? "Google sign-in needs to be configured by the site administrator." : googleError ? "Google sign-in could not be completed. Please try again." : null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.replace("/forms");
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Login failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="pb-1">
        <LogoMark />
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage your forms and responses.</p>
      </div>

      <GoogleSignInButton enabled={googleEnabled} source="login" />
      <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or sign in with email</span></div></div>

      <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" required autoFocus autoComplete="username" value={email}
          onChange={(event) => setEmail(event.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className={`${buttonPrimary} w-full`}>
        {submitting ? <SpinnerIcon className="h-4 w-4" /> : null}
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      </form>
    </div>
  );
}

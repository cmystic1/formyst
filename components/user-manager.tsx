"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { buttonPrimary, cardClass, inputClass, labelClass } from "@/components/ui";

type Account = { id: string; name: string; email: string; role: string };
type Notice = { kind: "success" | "error"; text: string };

export function UserManager({ users }: { users: Account[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  function generatePassword() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    setPassword(Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""));
    setShowPassword(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json()) as { error?: string; user?: { email: string } };
      if (!response.ok) throw new Error(result.error ?? "Could not create account.");
      setNotice({ kind: "success", text: `Account created for ${result.user?.email ?? email}. Share the sign-in details privately.` });
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not create account." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <section className={cardClass} aria-labelledby="create-account-heading">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <PlusIcon className="h-5 w-5" />
        </div>
        <h2 id="create-account-heading" className="mt-4 text-xl font-bold text-slate-950">Create an account</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          New members can sign in and create forms in their own workspace.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="new-name">Full name</label>
              <input id="new-name" className={inputClass} required maxLength={120} autoComplete="name"
                placeholder="Jane Smith" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="new-email">Email address</label>
              <input id="new-email" className={inputClass} type="email" required maxLength={191} autoComplete="email"
                placeholder="jane@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label className={labelClass} htmlFor="new-password">Initial password</label>
              <button type="button" onClick={generatePassword} className="text-xs font-semibold text-brand-600 hover:text-brand-500">
                Generate password
              </button>
            </div>
            <div className="relative">
              <input id="new-password" className={`${inputClass} pr-20`} type={showPassword ? "text" : "password"}
                required minLength={12} maxLength={128} autoComplete="new-password"
                placeholder="At least 12 characters" value={password}
                onChange={(event) => setPassword(event.target.value)} />
              <button type="button" onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 px-2 text-xs font-semibold text-brand-600 hover:text-brand-500">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Save and share this password privately before creating the account. It cannot be viewed later, and no email is sent automatically.
            </p>
          </div>
          <button type="submit" className={buttonPrimary} disabled={busy}>
            <PlusIcon className="h-4 w-4" />
            {busy ? "Creating account…" : "Create account"}
          </button>
          {notice ? (
            <p role={notice.kind === "error" ? "alert" : "status"}
              className={`rounded-xl px-3.5 py-3 text-sm ${notice.kind === "error"
                ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
              {notice.text}
            </p>
          ) : null}
        </form>
      </section>

      <section className={cardClass} aria-labelledby="accounts-heading">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="accounts-heading" className="text-xl font-bold text-slate-950">People with access</h2>
            <p className="mt-1 text-sm text-slate-500">Each account has its own private forms and responses.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{users.length}</span>
        </div>
        <ul className="mt-5 divide-y divide-slate-100">
          {users.map((user) => (
            <li key={user.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {user.name.trim().charAt(0).toUpperCase() || "U"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin"
                ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                {user.role === "admin" ? "Admin" : "Member"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

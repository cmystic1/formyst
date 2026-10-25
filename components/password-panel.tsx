"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { buttonPrimary, cardClass, inputClass, labelClass } from "@/components/ui";

export function PasswordPanel() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update password.");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update password.");
    } finally { setBusy(false); }
  }
  return <section className={cardClass}>
    <h2 className="text-xl font-bold text-slate-950">Change password</h2>
    <p className="mt-1 text-sm leading-6 text-slate-600">Use a unique password of at least 12 characters. You will sign in again after changing it.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="current-password">Current password</label>
          <input className={inputClass} id="current-password" type="password" autoComplete="current-password" required
            value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-password">New password</label>
          <input className={inputClass} id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required
            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
      </div>
      <button type="submit" className={buttonPrimary} disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p> : null}
    </form>
  </section>;
}

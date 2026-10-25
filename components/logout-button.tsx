"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonSecondary } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={busy} className={buttonSecondary}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

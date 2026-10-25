"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { buttonPrimary } from "@/components/ui";

export function FormListActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div>
    <button type="button" className={buttonPrimary} disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch("/api/forms", { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not create form.");
        router.push(`/forms/${data.id}/edit`);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create form.");
        setBusy(false);
      }
    }}><PlusIcon className="h-4 w-4" />{busy ? "Creating…" : "Create form"}</button>
    {error ? <p role="alert" className="mt-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-100">{error}</p> : null}
  </div>;
}

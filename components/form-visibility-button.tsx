"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonSecondary } from "@/components/ui";

export function FormVisibilityButton({ formId, published, compact = false }: { formId: string; published: boolean; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div>
    <button className={compact ? `${buttonSecondary} min-h-9 px-3 py-2 text-xs` : buttonSecondary} disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch("/api/forms", {
          method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify({ formId, published: !published }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not update form.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not update form.");
      } finally { setBusy(false); }
    }}>{busy ? "Updating…" : published ? "Unpublish" : "Publish"}</button>
    {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
  </div>;
}

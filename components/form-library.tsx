"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, FormsIcon } from "@/components/icons";
import { FormVisibilityButton } from "@/components/form-visibility-button";
import { buttonSecondary, inputClass } from "@/components/ui";
import { filterFormLibrary, type FormFilter } from "@/lib/form-library";

export type FormLibraryItem = {
  id: string;
  title: string;
  published: boolean;
  edited: string;
  responses: number;
  newResponses: number;
};

export function FormLibrary({ forms }: { forms: FormLibraryItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FormFilter>("all");
  const [query, setQuery] = useState("");
  const counts = {
    all: forms.length,
    published: forms.filter((form) => form.published).length,
    drafts: forms.filter((form) => !form.published).length,
  };
  const visibleForms = useMemo(() => filterFormLibrary(forms, filter, query), [filter, forms, query]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.03)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div role="group" aria-label="Filter forms" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {(["all", "published", "drafts"] as const).map((value) => {
            const label = value === "all" ? "All forms" : value === "published" ? "Published" : "Drafts";
            const selected = filter === value;
            return (
              <button key={value} type="button" aria-pressed={selected} onClick={() => setFilter(value)}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selected ? "bg-brand-50 text-brand-700" : "bg-white/70 text-slate-500"}`}>{counts[value]}</span>
              </button>
            );
          })}
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search forms</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" />
          </svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your forms" className={`${inputClass} min-h-10 py-2 pl-9`} />
        </label>
      </div>

      {visibleForms.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><FormsIcon className="h-5 w-5" /></span>
          <h3 className="mt-4 text-base font-bold text-slate-900">{forms.length ? "No matching forms" : "Your form library is empty"}</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
            {forms.length ? "Try another name or choose a different status filter." : "Create a form to start collecting responses in your workspace."}
          </p>
          {query ? <button type="button" className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-500" onClick={() => { setQuery(""); setFilter("all"); }}>Clear search and filters</button> : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleForms.map((form) => (
            <article key={form.id} className="group flex min-h-52 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.035)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_16px_36px_rgba(15,23,42,.08)]">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${form.published ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"}`}>
                  <FormsIcon className="h-5 w-5" />
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${form.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${form.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="mt-4 truncate text-lg font-bold tracking-tight text-slate-950">
                <Link href={`/forms/${form.id}/edit`} className="outline-none transition group-hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500">{form.title}</Link>
              </h3>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span><strong className="font-semibold text-slate-800">{form.responses}</strong> responses</span>
                {form.newResponses > 0 ? (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 font-bold text-white" aria-label={`${form.newResponses} new responses for ${form.title}`}>
                    {form.newResponses} new
                  </span>
                ) : null}
                <span>Edited {form.edited}</span>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Link href={`/forms/${form.id}/edit`} className={`${buttonSecondary} min-h-9 px-3 py-2 text-xs`}>Edit form</Link>
                <Link href={`/forms/${form.id}/submissions`} prefetch={false} className={`${buttonSecondary} min-h-9 px-3 py-2 text-xs`}>
                  Responses
                  {form.newResponses > 0 ? <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{form.newResponses}</span> : null}
                </Link>
                {form.published ? (
                  <Link href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer" className={`${buttonSecondary} min-h-9 px-3 py-2 text-xs`} aria-label={`Open ${form.title} in a new tab`}>
                    <ExternalLinkIcon className="h-3.5 w-3.5" /> Open
                  </Link>
                ) : null}
                <FormVisibilityButton formId={form.id} published={form.published} compact />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

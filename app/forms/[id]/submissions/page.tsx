import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { DownloadIcon, ExternalLinkIcon } from "@/components/icons";
import { SettingsPanel } from "@/components/settings-panel";
import { buttonSecondary, cardClass, sectionTitleClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { displayAnswer } from "@/lib/form-schema";
import {
  getFormDefinition,
  getIntegrationPresence,
  getOwnedForm,
  listSubmissions,
  markSubmissionsRead,
  submissionColumns,
} from "@/lib/store";

export const metadata = { title: "Submissions · Formyst" };

// Dashboard-style page: render at request time (blocking is fine for a self-hosted app).
export const instant = false;

function formatTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export default async function AdminPage({ params }: PageProps<"/forms/[id]/submissions">) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const ownedForm = await getOwnedForm(user.id, id);
  if (!ownedForm) notFound();

  const [form, submissions, presence] = await Promise.all([
    getFormDefinition(id, user.id),
    listSubmissions(user.id, id),
    getIntegrationPresence(id),
  ]);
  const columns = submissionColumns(form?.fields ?? [], submissions);
  await markSubmissionsRead(user.id, id, submissions.map((submission) => submission.id));
  const integrationCount = [
    presence.n8nWebhookUrl,
    presence.telegramBotToken && presence.telegramChatId,
    presence.slackWebhookUrl,
    presence.discordWebhookUrl,
    presence.genericWebhookUrl,
  ].filter(Boolean).length;
  const latestResponse = submissions[0]?.createdAt ?? null;

  return (
    <AppShell user={user} active="forms">
      <div className="space-y-6">
        <section className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_10px_28px_rgba(15,23,42,.04)] sm:px-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-brand-100/70 blur-3xl" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-brand-600"><Link href="/forms" className="hover:text-brand-800">Forms</Link> / Responses</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {form?.title ?? "Your form"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {submissions.length} response{submissions.length === 1 ? "" : "s"}
              {submissions.length > 0 ? ` · latest ${formatTimestamp(submissions[0].createdAt)}` : ""}
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <Link href={`/forms/${id}/edit`} className={buttonSecondary}>Edit form</Link>
            {ownedForm.published ? (
              <Link href={`/f/${id}`} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
                <ExternalLinkIcon className="h-4 w-4" /> Open form
              </Link>
            ) : null}
            <a href={`/api/submissions/export?formId=${encodeURIComponent(id)}`}
              className={buttonSecondary} aria-disabled={submissions.length === 0}>
              <DownloadIcon className="h-4 w-4" /> Export CSV
            </a>
          </div>
        </section>

        <section aria-label="Response overview" className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.03)]">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Total responses</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{submissions.length}</p>
            <p className="mt-1 text-xs text-slate-500">Saved to this form</p>
          </div>
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.03)]">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Latest response</p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-950">{latestResponse ? formatTimestamp(latestResponse).slice(0, 16) : "No responses yet"}</p>
            <p className="mt-1 text-xs text-slate-500">{latestResponse ? "Date and time in UTC" : "Share the form link to get started"}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.03)]">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Active integrations</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{integrationCount}<span className="ml-1 text-base font-semibold text-slate-400">/ 5</span></p>
            <p className="mt-1 text-xs text-slate-500">Automated delivery connections</p>
          </div>
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={sectionTitleClass}>All responses</h2>
              <p className="mt-1 text-xs text-slate-500">Newest responses appear first.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{submissions.length} total</span>
          </div>

          {submissions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm"><DownloadIcon className="h-5 w-5 rotate-180" /></span>
              <h3 className="mt-4 text-base font-bold text-slate-900">Your first response will show up here</h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">Share your form with respondents. As soon as someone submits it, you can review and export their answers here.</p>
              {ownedForm.published ? <Link href={`/f/${id}`} target="_blank" className={`${buttonSecondary} mt-4`}>Open public form <ExternalLinkIcon className="h-4 w-4" /></Link> : <Link href={`/forms/${id}/edit`} className={`${buttonSecondary} mt-4`}>Finish and publish form</Link>}
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="bg-slate-50/90">
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="whitespace-nowrap px-3 py-2 font-semibold">Submitted</th>
                      {columns.map((column) => (
                        <th key={column.id} className="whitespace-nowrap px-3 py-2 font-semibold">
                          {column.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">
                          {formatTimestamp(submission.createdAt)}
                        </td>
                        {columns.map((column) => {
                          const value = displayAnswer(column.field, submission.answers[column.id]);
                          return (
                            <td key={column.id} className="max-w-xs px-3 py-2.5 align-top text-slate-700">
                              {value ? (
                                <span className="whitespace-pre-wrap break-words">{value}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {submissions.map((submission) => (
                  <article key={submission.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-mono text-xs text-slate-500">
                      {formatTimestamp(submission.createdAt)}
                    </p>
                    <dl className="mt-3 space-y-2">
                      {columns.map((column) => (
                        <div key={column.id}>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {column.header}
                          </dt>
                          <dd className="whitespace-pre-wrap break-words text-sm text-slate-700">
                            {displayAnswer(column.field, submission.answers[column.id]) || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitleClass}>Integrations</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Forward submissions to n8n or an automation webhook, and send summaries to Telegram, Slack, or Discord.
          </p>
          <SettingsPanel presence={presence} formId={id} />
        </section>
      </div>
    </AppShell>
  );
}

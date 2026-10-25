import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedForm } from "@/lib/store";
import { buildCsv, csvFilename } from "@/lib/csv";
import { displayAnswer } from "@/lib/form-schema";
import { getFormDefinition, listSubmissions, submissionColumns } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const formId = new URL(request.url).searchParams.get("formId") ?? "";
  if (!(await getOwnedForm(user.id, formId))) return new Response("Not found", { status: 404 });

  const [form, submissions] = await Promise.all([
    getFormDefinition(formId, user.id), listSubmissions(user.id, formId),
  ]);
  const columns = submissionColumns(form?.fields ?? [], submissions);

  const headers = ["Submitted at", ...columns.map((column) => column.header)];
  const rows = submissions
    .slice()
    .reverse()
    .map((submission) => [
      submission.createdAt.toISOString(),
      ...columns.map((column) => displayAnswer(column.field, submission.answers[column.id])),
    ]);

  return new Response(buildCsv(headers, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${csvFilename()}"`,
      "cache-control": "no-store",
    },
  });
}

import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createForm, getOwnedForm } from "@/lib/store";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized.");
  if (!rateLimit(`create-form:${user.id}:${getClientIp(request)}`, 20, 60_000).ok)
    return jsonError(429, "Too many forms created. Please wait.");
  const id = await createForm(user.id);
  return Response.json({ id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized.");
  if (!rateLimit(`visibility:${user.id}:${getClientIp(request)}`, 60, 60_000).ok)
    return jsonError(429, "Too many updates. Please wait.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { formId?: unknown; published?: unknown } | null;
  if (typeof input?.formId !== "string" || typeof input.published !== "boolean")
    return jsonError(400, "Invalid form visibility.");
  const row = await getOwnedForm(user.id, input.formId);
  if (!row) return jsonError(404, "Form not found.");
  if (input.published) {
    try {
      const fields: unknown = JSON.parse(row.fields);
      if (!Array.isArray(fields) || fields.length === 0)
        return jsonError(400, "Add a field before publishing.");
    } catch { return jsonError(400, "Form fields are invalid."); }
  }
  await prisma.form.updateMany({
    where: { id: row.id, ownerId: user.id }, data: { published: input.published },
  });
  return Response.json({ ok: true });
}

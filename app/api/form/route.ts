import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { parseFormDefinition } from "@/lib/form-schema";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { saveFormDefinition } from "@/lib/store";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized.");

  const limit = rateLimit(`form-save:${user.id}:${getClientIp(request)}`, 60, 60 * 1000);
  if (!limit.ok) return jsonError(429, "Too many requests. Please slow down.");

  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);

  const input = body.value as Record<string, unknown> | null;
  const formId = typeof input?.formId === "string" ? input.formId : "";
  if (!/^[a-z0-9]{20,32}$/.test(formId)) return jsonError(400, "Invalid form.");
  const parsed = parseFormDefinition(input?.form);
  if (!parsed.ok) {
    return jsonError(400, "Form validation failed.", { errors: parsed.errors });
  }

  const saved = await saveFormDefinition(user.id, formId, parsed.value);
  if (!saved) return jsonError(404, "Form not found.");
  return Response.json({ ok: true, form: saved });
}

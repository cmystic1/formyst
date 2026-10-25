import { after } from "next/server";
import { validateSubmission } from "@/lib/form-schema";
import { isSameOrigin } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/http";
import { deliverSubmission } from "@/lib/integrations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createSubmission, getFormDefinition } from "@/lib/store";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);

  const formId = (body.value as { formId?: unknown } | null)?.formId;
  if (typeof formId !== "string" || !/^[a-z0-9]{20,32}$/.test(formId)) return jsonError(404, "Form not found.");
  const formLimit = rateLimit(`submit-form:${formId}`, 120, 60 * 1000);
  const ipLimit = process.env.TRUST_PROXY === "true"
    ? rateLimit(`submit-ip:${formId}:${getClientIp(request)}`, 10, 60 * 1000)
    : formLimit;
  if (!formLimit.ok || !ipLimit.ok) return jsonError(429, "Too many submissions. Please wait a moment and try again.", {
    retryAfterSeconds: Math.max(formLimit.retryAfterSeconds, ipLimit.retryAfterSeconds),
  });
  const form = await getFormDefinition(formId);
  if (!form || form.fields.length === 0) {
    return jsonError(409, "This form is not accepting responses yet.");
  }

  const answersInput = (body.value as { answers?: unknown } | null)?.answers;
  const validation = validateSubmission(form, answersInput);
  if (!validation.ok) {
    return jsonError(400, "Please fix the highlighted fields.", { errors: validation.errors });
  }

  // Persist first: integrations must never be able to lose a response.
  const submission = await createSubmission(formId, validation.answers);

  after(async () => {
    try {
      await deliverSubmission(submission, form, undefined, formId);
    } catch (error) {
      console.error(
        `[formyst] integration delivery crashed for submission ${submission.id} (data was saved):`,
        error,
      );
    }
  });

  return Response.json({ ok: true, id: submission.id });
}

import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { clearAssistantHistory, loadAssistantHistory } from "@/lib/assistant-memory";
import { jsonError } from "@/lib/http";
import { getOwnedForm } from "@/lib/store";

async function context(request: Request) {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError(401, "Sign in to use the assistant.") };
  const formId = new URL(request.url).searchParams.get("formId");
  if (formId !== null && (!formId || formId.length > 64 || !await getOwnedForm(user.id, formId))) {
    return { error: jsonError(404, "Form not found.") };
  }
  return { userId: user.id, formId };
}

export async function GET(request: Request) {
  const result = await context(request);
  if ("error" in result) return result.error;
  return Response.json({ messages: await loadAssistantHistory(result.userId, result.formId, 30) });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const result = await context(request);
  if ("error" in result) return result.error;
  await clearAssistantHistory(result.userId, result.formId);
  return Response.json({ messages: [] });
}

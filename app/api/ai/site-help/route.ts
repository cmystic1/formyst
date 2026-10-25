import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { answerSiteHelp } from "@/lib/assistant-help";
import { jsonError, readJsonBody } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to use the assistant.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { prompt?: unknown } | null;
  if (typeof input?.prompt !== "string") return jsonError(400, "Enter a question.");
  if (!rateLimit(`ai-help:${user.id}`, 12, 10 * 60_000).ok) {
    return jsonError(429, "Please wait a few minutes before asking more questions.");
  }
  return answerSiteHelp(input.prompt);
}

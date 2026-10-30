import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { answerSiteHelp } from "@/lib/assistant-help";
import { jsonError, readJsonBody } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { loadAssistantHistory, saveAssistantExchange } from "@/lib/assistant-memory";

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
  const history = await loadAssistantHistory(user.id, null, 12);
  const response = await answerSiteHelp(input.prompt, history);
  if (!response.ok) return response;
  const data = await response.clone().json() as { reply: string };
  await saveAssistantExchange(user.id, null, input.prompt.trim(), data.reply);
  return response;
}

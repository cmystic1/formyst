import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getOwnedForm } from "@/lib/store";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isAllowedWebhookUrl, isServiceWebhookUrl } from "@/lib/webhook-url";
import {
  INTEGRATION_SETTING_KEYS,
  IntegrationSettingKey,
  updateIntegrationSettings,
} from "@/lib/store";

const TELEGRAM_TOKEN_RE = /^\d{5,}:[A-Za-z0-9_-]{20,}$/;
const TELEGRAM_CHAT_ID_RE = /^(-?\d{5,}|@[A-Za-z0-9_]{4,})$/;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized.");

  const limit = rateLimit(`settings:${user.id}:${getClientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return jsonError(429, "Too many requests. Please slow down.");

  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);

  const input = body.value as Record<string, unknown> | null;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return jsonError(400, "Invalid settings payload.");
  }
  const formId = typeof input.formId === "string" ? input.formId : "";
  if (!(await getOwnedForm(user.id, formId))) return jsonError(404, "Form not found.");

  const errors: Record<string, string> = {};
  const values: Partial<Record<IntegrationSettingKey, string>> = {};

  const webhook = typeof input.n8nWebhookUrl === "string" ? input.n8nWebhookUrl.trim() : "";
  if (webhook) {
    if (webhook.length > 2048 || !isAllowedWebhookUrl(webhook)) {
      errors.n8nWebhookUrl = "Use an HTTPS URL on a host allowed by the server operator.";
    } else {
      values.n8nWebhookUrl = webhook;
    }
  }

  const token = typeof input.telegramBotToken === "string" ? input.telegramBotToken.trim() : "";
  if (token) {
    if (token.length > 255 || !TELEGRAM_TOKEN_RE.test(token)) {
      errors.telegramBotToken = "That does not look like a Telegram bot token.";
    } else {
      values.telegramBotToken = token;
    }
  }

  const chatId = typeof input.telegramChatId === "string" ? input.telegramChatId.trim() : "";
  if (chatId) {
    if (chatId.length > 100 || !TELEGRAM_CHAT_ID_RE.test(chatId)) {
      errors.telegramChatId = "Enter a numeric chat ID (-100…) or @channelusername.";
    } else {
      values.telegramChatId = chatId;
    }
  }

  for (const key of ["slackWebhookUrl", "discordWebhookUrl", "genericWebhookUrl"] as const) {
    const url = typeof input[key] === "string" ? input[key].trim() : "";
    if (!url) continue;
    const valid = key === "genericWebhookUrl"
      ? isAllowedWebhookUrl(url)
      : isServiceWebhookUrl(url, key === "slackWebhookUrl" ? "slack" : "discord");
    if (url.length > 2048 || !valid) {
      errors[key] = "Use a valid HTTPS webhook URL on a host allowed by the server operator.";
    } else {
      values[key] = url;
    }
  }

  const clearRaw = Array.isArray(input.clear) ? input.clear : [];
  const clear = clearRaw.filter((key): key is IntegrationSettingKey =>
    (INTEGRATION_SETTING_KEYS as readonly string[]).includes(String(key)),
  );

  if (Object.keys(errors).length > 0) {
    return jsonError(400, "Some settings are invalid.", { errors });
  }

  const presence = await updateIntegrationSettings(formId, values, clear);
  return Response.json({ ok: true, presence });
}

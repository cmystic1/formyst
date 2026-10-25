import { FormDefinition, formatAnswer } from "./form-schema";
import {
  getIntegrationSettings,
  SubmissionRecord,
  type IntegrationSettings,
} from "./store";
import { isAllowedWebhookUrl } from "./webhook-url";

const DELIVERY_TIMEOUT_MS = 8000;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function buildWebhookPayload(submission: SubmissionRecord, form: FormDefinition) {
  const answers: Record<string, string> = {};
  const answersByLabel: Record<string, string> = {};
  for (const field of form.fields) {
    const value = formatAnswer(submission.answers[field.id]);
    answers[field.id] = value;
    answersByLabel[field.label] = value;
  }

  return {
    event: "submission.created",
    form: { title: form.title },
    submission: {
      id: submission.id,
      createdAt: submission.createdAt.toISOString(),
      answers,
    },
    fields: form.fields.map((field) => ({ id: field.id, label: field.label, type: field.type })),
    answersByLabel,
  };
}

export function buildTelegramMessage(submission: SubmissionRecord, form: FormDefinition): string {
  const lines = [
    `New submission — ${form.title}`,
    `Time: ${submission.createdAt.toISOString()}`,
    "",
  ];
  for (const field of form.fields) {
    const value = formatAnswer(submission.answers[field.id]) || "—";
    lines.push(`${field.label}: ${truncate(value, 500)}`);
  }
  return truncate(lines.join("\n"), 3900);
}

async function sendToWebhook(url: string, payload: unknown): Promise<void> {
  if (!isAllowedWebhookUrl(url)) throw new Error("webhook destination is not allowed");
  const response = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`webhook responded ${response.status}`);
  }
}

async function sendToTelegram(token: string, chatId: string, text: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Telegram responded ${response.status}`);
  }
}

function logFailure(integration: string, submissionId: string, error: unknown): void {
  const message = error instanceof Error
    ? (/^(?:webhook|Telegram) responded \d+$/.test(error.message) ||
       error.message === "webhook destination is not allowed" ? error.message : error.name)
    : "Unknown error";
  console.error(
    `[formyst] ${integration} delivery failed for submission ${submissionId} (data was saved): ${message}`,
  );
}

/**
 * Delivers a saved submission to the configured integrations.
 * Failures are logged and never throw — the submission is already persisted.
 */
export async function deliverSubmission(
  submission: SubmissionRecord,
  form: FormDefinition,
  settings?: IntegrationSettings,
  formId?: string,
): Promise<void> {
  const config = settings ?? (formId ? await getIntegrationSettings(formId) : { n8nWebhookUrl: "", telegramBotToken: "", telegramChatId: "" });
  const tasks: Promise<void>[] = [];

  if (config.n8nWebhookUrl) {
    tasks.push(
      sendToWebhook(config.n8nWebhookUrl, buildWebhookPayload(submission, form)).catch((error) =>
        logFailure("n8n webhook", submission.id, error),
      ),
    );
  }

  if (config.telegramBotToken && config.telegramChatId) {
    tasks.push(
      sendToTelegram(
        config.telegramBotToken,
        config.telegramChatId,
        buildTelegramMessage(submission, form),
      ).catch((error) => logFailure("Telegram", submission.id, error)),
    );
  } else if (config.telegramBotToken && !config.telegramChatId) {
    console.warn(
      "[formyst] Telegram bot token is set but chat ID is missing — notification skipped.",
    );
  }

  await Promise.all(tasks);
}

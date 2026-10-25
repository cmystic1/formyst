/**
 * Integration settings schema shared by server (storage) and client (admin UI).
 * Must stay free of Node-only imports.
 */

export const INTEGRATION_SETTING_KEYS = [
  "n8nWebhookUrl",
  "telegramBotToken",
  "telegramChatId",
  "slackWebhookUrl",
  "discordWebhookUrl",
  "genericWebhookUrl",
] as const;

export type IntegrationSettingKey = (typeof INTEGRATION_SETTING_KEYS)[number];

export type IntegrationSettings = Record<IntegrationSettingKey, string>;

/** Database column keys used in the Setting table. */
export const SETTING_DB_KEY_MAP: Record<IntegrationSettingKey, string> = {
  n8nWebhookUrl: "n8n_webhook_url",
  telegramBotToken: "telegram_bot_token",
  telegramChatId: "telegram_chat_id",
  slackWebhookUrl: "slack_webhook_url",
  discordWebhookUrl: "discord_webhook_url",
  genericWebhookUrl: "generic_webhook_url",
};

export const INTEGRATION_LABELS: Record<IntegrationSettingKey, string> = {
  n8nWebhookUrl: "n8n webhook URL",
  telegramBotToken: "Telegram bot token",
  telegramChatId: "Telegram chat ID",
  slackWebhookUrl: "Slack incoming webhook URL",
  discordWebhookUrl: "Discord webhook URL",
  genericWebhookUrl: "Automation webhook URL",
};

export function isIntegrationSettingKey(value: unknown): value is IntegrationSettingKey {
  return (INTEGRATION_SETTING_KEYS as readonly string[]).includes(String(value));
}

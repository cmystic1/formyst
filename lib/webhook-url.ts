/** Only destinations explicitly configured by the operator may receive submissions. */
export function isAllowedWebhookUrl(value: string): boolean {
  const allowed = (process.env.WEBHOOK_ALLOWED_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.hash && allowed.includes(url.host.toLowerCase());
  } catch {
    return false;
  }
}

export function isServiceWebhookUrl(value: string, service: "slack" | "discord"): boolean {
  if (!isAllowedWebhookUrl(value)) return false;
  const url = new URL(value);
  if (service === "slack") {
    return url.hostname === "hooks.slack.com" && /^\/services\/[^/]+\/[^/]+\/[^/]+\/?$/.test(url.pathname);
  }
  return (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
    /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[^/]+\/?$/.test(url.pathname);
}

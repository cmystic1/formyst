"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SpinnerIcon } from "@/components/icons";
import { buttonPrimary, inputClass, labelClass } from "@/components/ui";
import {
  INTEGRATION_SETTING_KEYS,
  type IntegrationSettingKey,
} from "@/lib/settings";

type Presence = Record<IntegrationSettingKey, boolean>;

const FIELD_META: Record<
  IntegrationSettingKey,
  { label: string; description: string; placeholder: string; inputType: string }
> = {
  n8nWebhookUrl: {
    label: "n8n webhook URL",
    description: "Each submission is POSTed after saving. The server operator must allow this HTTPS host.",
    placeholder: "https://n8n.example.com/webhook/abc123",
    inputType: "url",
  },
  telegramBotToken: {
    label: "Telegram bot token",
    description: "From @BotFather. Stored server-side and never sent to the browser.",
    placeholder: "123456789:AA…",
    inputType: "password",
  },
  telegramChatId: {
    label: "Telegram chat ID",
    description: "Numeric chat ID (−100…) or @channelusername that receives the message.",
    placeholder: "-1001234567890",
    inputType: "text",
  },
  slackWebhookUrl: {
    label: "Slack incoming webhook",
    description: "Post a response summary to the channel linked to this webhook. Allow hooks.slack.com on the server.",
    placeholder: "https://hooks.slack.com/services/...",
    inputType: "password",
  },
  discordWebhookUrl: {
    label: "Discord webhook",
    description: "Post a response summary to the linked Discord channel. Allow discord.com on the server.",
    placeholder: "https://discord.com/api/webhooks/...",
    inputType: "password",
  },
  genericWebhookUrl: {
    label: "Automation webhook",
    description: "Send the full response payload to Zapier, Make, or another HTTPS endpoint. Allow its host on the server.",
    placeholder: "https://hooks.zapier.com/hooks/catch/...",
    inputType: "password",
  },
};

const emptySettings: Record<IntegrationSettingKey, string> = {
  n8nWebhookUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  slackWebhookUrl: "",
  discordWebhookUrl: "",
  genericWebhookUrl: "",
};

function ClearToggle({
  active,
  onToggle,
  label,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {active ? `Will remove ${label}` : "Remove"}
    </button>
  );
}

export function SettingsPanel({ presence, formId }: { presence: Presence; formId: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<IntegrationSettingKey, string>>(emptySettings);
  const [clearList, setClearList] = useState<IntegrationSettingKey[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function toggleClear(key: IntegrationSettingKey) {
    setClearList((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId, ...values, clear: clearList }),
      });

      if (response.ok) {
        setValues(emptySettings);
        setClearList([]);
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { error?: string; errors?: Record<string, string> }
        | null;
      setErrors(data?.errors ?? {});
      setFormError(data?.error ?? "Saving settings failed. Please try again.");
      setStatus("idle");
    } catch {
      setFormError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {INTEGRATION_SETTING_KEYS.map((key) => {
        const meta = FIELD_META[key];
        const configured = presence[key];
        return (
          <div key={key}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`setting-${key}`} className={labelClass}>
                {meta.label}
                {configured ? (
                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Configured
                  </span>
                ) : (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Not set
                  </span>
                )}
              </label>
              {configured ? (
                <ClearToggle
                  active={clearList.includes(key)}
                  onToggle={() => toggleClear(key)}
                  label={meta.label}
                />
              ) : null}
            </div>
            <input
              id={`setting-${key}`}
              type={meta.inputType}
              autoComplete="off"
              value={clearList.includes(key) ? "" : values[key]}
              disabled={clearList.includes(key)}
              placeholder={configured ? "Saved — leave blank to keep" : meta.placeholder}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, [key]: event.target.value }))
              }
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">{meta.description}</p>
            {errors[key] ? <p className="mt-1.5 text-xs text-red-600">{errors[key]}</p> : null}
          </div>
        );
      })}

      {formError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className={buttonPrimary}>
          {status === "saving" ? <SpinnerIcon className="h-4 w-4" /> : null}
          {status === "saving" ? "Saving…" : "Save integrations"}
        </button>
        {status === "saved" ? (
          <span className="text-sm font-medium text-emerald-600">Settings saved</span>
        ) : null}
      </div>

      <p className="text-xs text-slate-400">
        Integrations run after the submission is stored. If delivery fails, the response is kept and
        the error is logged on the server.
      </p>
    </form>
  );
}

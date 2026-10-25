import { prisma } from "./db";
import {
  Answers,
  FormDefinition,
  FormField,
  THEME_DEFAULTS,
  normalizeFormDefinition,
  parseFormDefinition,
  parseTheme,
  type FormTheme,
} from "./form-schema";
import {
  INTEGRATION_SETTING_KEYS,
  SETTING_DB_KEY_MAP,
  type IntegrationSettingKey,
  type IntegrationSettings,
} from "./settings";

export type { IntegrationSettingKey, IntegrationSettings };
export { INTEGRATION_SETTING_KEYS };

function readTheme(raw: string): FormTheme {
  try { return parseTheme(JSON.parse(raw)); }
  catch { return { ...THEME_DEFAULTS }; }
}

function definitionFromRow(row: {
  title: string; description: string; submitLabel: string; logo: string; cover: string;
  background: string; poweredBy: boolean; successTitle: string; successMessage: string; successButton: string;
  theme: string; fields: string;
}): FormDefinition | null {
  let fields: unknown;
  try { fields = JSON.parse(row.fields); }
  catch { return null; }
  const parsed = parseFormDefinition({
    title: row.title, description: row.description, submitLabel: row.submitLabel,
    logo: row.logo, cover: row.cover, background: row.background, poweredBy: row.poweredBy,
    successTitle: row.successTitle, successMessage: row.successMessage,
    successButton: row.successButton, theme: readTheme(row.theme), fields,
  });
  return parsed.ok ? normalizeFormDefinition(parsed.value) : null;
}

export async function listForms(ownerId: string) {
  return prisma.form.findMany({
    where: { ownerId },
    select: { id: true, title: true, published: true, updatedAt: true, _count: { select: { submissions: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOwnedForm(ownerId: string, formId: string) {
  return prisma.form.findFirst({ where: { id: formId, ownerId } });
}

export async function getFormDefinition(formId: string, ownerId?: string): Promise<FormDefinition | null> {
  const row = await prisma.form.findFirst({
    where: { id: formId, ...(ownerId ? { ownerId } : { published: true }) },
  });
  return row ? definitionFromRow(row) : null;
}

export async function createForm(ownerId: string): Promise<string> {
  const row = await prisma.form.create({
    data: { ownerId, description: "", logo: "", cover: "", background: "",
      successMessage: "Your response has been recorded.", theme: "{}", fields: "[]" },
  });
  return row.id;
}

export async function saveFormDefinition(ownerId: string, formId: string, form: FormDefinition): Promise<FormDefinition | null> {
  const data = {
    title: form.title, description: form.description, submitLabel: form.submitLabel,
    logo: form.logo, cover: form.cover, background: form.background, poweredBy: form.poweredBy,
    successTitle: form.successTitle, successMessage: form.successMessage,
    successButton: form.successButton, theme: JSON.stringify(form.theme),
    fields: JSON.stringify(form.fields),
    ...(form.fields.length === 0 ? { published: false } : {}),
  };
  const result = await prisma.form.updateMany({ where: { id: formId, ownerId }, data });
  return result.count ? form : null;
}

export type SubmissionRecord = { id: string; createdAt: Date; answers: Answers };

function parseAnswers(raw: string): Answers {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Answers;
  } catch { /* corrupt legacy row */ }
  return {};
}

export async function listSubmissions(ownerId: string, formId: string): Promise<SubmissionRecord[]> {
  const rows = await prisma.submission.findMany({
    where: { formId, form: { ownerId } }, orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({ id: row.id, createdAt: row.createdAt, answers: parseAnswers(row.answers) }));
}

export async function createSubmission(formId: string, answers: Answers): Promise<SubmissionRecord> {
  const row = await prisma.submission.create({ data: { formId, answers: JSON.stringify(answers) } });
  return { id: row.id, createdAt: row.createdAt, answers };
}

export type SubmissionColumn = { id: string; header: string; field?: FormField };
export function submissionColumns(fields: FormField[], submissions: SubmissionRecord[]): SubmissionColumn[] {
  const knownIds = new Set(fields.map((field) => field.id));
  const orphanIds: string[] = [];
  for (const submission of submissions) {
    for (const id of Object.keys(submission.answers)) {
      if (!knownIds.has(id) && !orphanIds.includes(id)) orphanIds.push(id);
    }
  }
  return [
    ...fields.map((field) => ({ id: field.id, header: field.label, field })),
    ...orphanIds.map((id) => ({ id, header: `(deleted field ${id})` })),
  ];
}

export async function getIntegrationSettings(formId: string): Promise<IntegrationSettings> {
  const rows = await prisma.setting.findMany({
    where: { formId, key: { in: Object.values(SETTING_DB_KEY_MAP) } },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    n8nWebhookUrl: byKey.get(SETTING_DB_KEY_MAP.n8nWebhookUrl) ?? "",
    telegramBotToken: byKey.get(SETTING_DB_KEY_MAP.telegramBotToken) ?? "",
    telegramChatId: byKey.get(SETTING_DB_KEY_MAP.telegramChatId) ?? "",
  };
}

export async function getIntegrationPresence(formId: string): Promise<Record<IntegrationSettingKey, boolean>> {
  const settings = await getIntegrationSettings(formId);
  return {
    n8nWebhookUrl: settings.n8nWebhookUrl.length > 0,
    telegramBotToken: settings.telegramBotToken.length > 0,
    telegramChatId: settings.telegramChatId.length > 0,
  };
}

export async function updateIntegrationSettings(
  formId: string, values: Partial<IntegrationSettings>, clear: IntegrationSettingKey[] = [],
): Promise<Record<IntegrationSettingKey, boolean>> {
  const operations = [];
  for (const key of clear) {
    operations.push(prisma.setting.deleteMany({ where: { formId, key: SETTING_DB_KEY_MAP[key] } }));
  }
  for (const key of INTEGRATION_SETTING_KEYS) {
    const value = values[key];
    if (value === undefined) continue;
    const compound = { formId_key: { formId, key: SETTING_DB_KEY_MAP[key] } };
    operations.push(prisma.setting.upsert({
      where: compound, update: { value }, create: { formId, key: SETTING_DB_KEY_MAP[key], value },
    }));
  }
  if (operations.length) await prisma.$transaction(operations);
  return getIntegrationPresence(formId);
}

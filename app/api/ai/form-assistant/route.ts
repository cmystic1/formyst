import { z } from "zod";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getOwnedForm } from "@/lib/store";
import { answerSiteHelp } from "@/lib/assistant-help";
import { FORMYST_HELP_GUIDE } from "@/lib/assistant-guidance";
import { loadAssistantHistory, saveAssistantExchange } from "@/lib/assistant-memory";
import { allowedThemeKeys, completeThemePatch, editPlanJsonSchema, editPlanSchema, glassDirectionFromPlan, includeNamedThemeAreas, normalizePatchColors, planSystemPrompt, reconcileGlassDirection, refineEverydayPlan, resolveGlassFollowUp, validateEditPlan, type EditScope, type ThemeArea } from "@/lib/assistant-planner";
import { formEditSystemPrompt } from "@/lib/assistant-design-prompt";
import { isReadabilityRequest, repairFormReadability } from "@/lib/form-readability";
import {
  CHOICE_TYPES,
  FIELD_TYPES,
  FIELD_BORDER_WIDTHS,
  FIELD_STYLE_DEFAULTS,
  FIELD_SIZES,
  FIELD_STYLE_RADII,
  MAX_FIELDS,
  MAX_OPTIONS,
  THEME_ALIGNMENTS,
  THEME_BUTTON_ALIGNMENTS,
  THEME_BUTTON_SHAPES,
  THEME_BUTTON_SIZES,
  THEME_BUTTON_WIDTHS,
  THEME_CARD_MATERIALS,
  THEME_FONTS,
  THEME_RADIUSES,
  THEME_SURFACES,
  createField,
  newId,
  parseFormDefinition,
  type FormDefinition,
} from "@/lib/form-schema";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const optionalHexColor = z.string().regex(/^(?:$|#[0-9a-fA-F]{6})$/);

const assistantStyleSchema = z.object({
    labelColor: optionalHexColor,
    inputBg: optionalHexColor,
    inputText: optionalHexColor,
    inputBorder: optionalHexColor,
    accent: optionalHexColor,
    radius: z.enum(FIELD_STYLE_RADII),
    size: z.enum(FIELD_SIZES),
    borderWidth: z.enum(FIELD_BORDER_WIDTHS),
}).strict();

const assistantThemeSchema = z.object({
  accent: hexColor,
  radius: z.enum(THEME_RADIUSES),
  surface: z.enum(THEME_SURFACES),
  cardMaterial: z.enum(THEME_CARD_MATERIALS),
  glassOpacity: z.number().min(0.2).max(0.9),
  font: z.enum(THEME_FONTS),
  fontCustom: z.string().max(300).regex(/^[\w\s,"'-]*$/),
  pageBg: optionalHexColor,
  cardBg: optionalHexColor,
  button: z.enum(THEME_BUTTON_WIDTHS),
  buttonWidthCustom: z.string().regex(/^\d{1,4}(?:px|rem|em|%)$/),
  buttonColor: optionalHexColor,
  buttonTextColor: optionalHexColor,
  buttonShape: z.enum(THEME_BUTTON_SHAPES),
  buttonSize: z.enum(THEME_BUTTON_SIZES),
  buttonFontSizeCustom: z.number().int().min(10).max(32),
  buttonPaddingYCustom: z.number().int().min(4).max(32),
  buttonPaddingXCustom: z.number().int().min(8).max(48),
  buttonAlign: z.enum(THEME_BUTTON_ALIGNMENTS),
  align: z.enum(THEME_ALIGNMENTS),
}).partial().strict();

const assistantFieldChangeSchema = z.object({
  action: z.enum(["add", "update", "remove", "move"]),
  id: z.string().max(64).optional(),
  toIndex: z.number().int().min(0).max(MAX_FIELDS - 1).optional(),
  type: z.enum(FIELD_TYPES).optional(),
  label: z.string().max(300).optional(),
  placeholder: z.string().max(300).optional(),
  helpText: z.string().max(500).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(MAX_OPTIONS).optional(),
  style: assistantStyleSchema.partial().optional(),
}).strict();

const proposalSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  submitLabel: z.string().max(60).optional(),
  theme: assistantThemeSchema.optional(),
  fieldStyle: assistantStyleSchema.partial().optional(),
  fields: z.array(assistantFieldChangeSchema).max(MAX_FIELDS).optional(),
}).strict();

function scopedProposalSchema(scopes: readonly EditScope[], areas: readonly ThemeArea[]) {
  const shape: Record<string, z.ZodType> = {};
  if (scopes.includes("theme")) {
    const themeShape: Record<string, z.ZodType> = {};
    for (const key of allowedThemeKeys(areas)) themeShape[key] = assistantThemeSchema.shape[key];
    shape.theme = z.object(themeShape).strict();
  }
  if (scopes.includes("fieldStyle")) shape.fieldStyle = areas.includes("whole") ? assistantStyleSchema : assistantStyleSchema.partial();
  if (scopes.includes("fields")) shape.fields = z.array(assistantFieldChangeSchema).max(MAX_FIELDS);
  if (scopes.includes("copy")) {
    shape.title = z.string().max(200).optional();
    shape.description = z.string().max(2000).optional();
    shape.submitLabel = z.string().max(60).optional();
  }
  return z.object(shape).strict();
}

function proposalWouldChange(
  current: FormDefinition,
  proposed: z.infer<typeof proposalSchema>,
  glassDirection?: "lower" | "higher",
): boolean {
  const themePatch = completeThemePatch(proposed.theme ?? {}, current.theme, glassDirection);
  if (Object.entries(themePatch).some(([key, value]) => current.theme[key as keyof typeof current.theme] !== value)) return true;
  if (proposed.fields?.length) return true;
  if (proposed.fieldStyle && current.fields.some((field) =>
    Object.entries(proposed.fieldStyle ?? {}).some(([key, value]) =>
      (field.style?.[key as keyof typeof FIELD_STYLE_DEFAULTS] ?? FIELD_STYLE_DEFAULTS[key as keyof typeof FIELD_STYLE_DEFAULTS]) !== value))) return true;
  return (proposed.title !== undefined && proposed.title !== current.title) ||
    (proposed.description !== undefined && proposed.description !== current.description) ||
    (proposed.submitLabel !== undefined && proposed.submitLabel !== current.submitLabel);
}

async function ollamaFailure(response: Response): Promise<Response> {
  const failure = await response.json().catch(() => null) as { error?: unknown } | null;
  const detail = typeof failure?.error === "string" ? failure.error.slice(0, 500) : "Unknown Ollama error";
  console.error("[form-assistant] Local Ollama request failed.", { status: response.status, detail });
  if (response.status === 404) {
    return jsonError(503, "The configured Ollama model is not installed. Pull the model named in OLLAMA_MODEL, then try again.");
  }
  if (detail.includes("llama-server binary not found")) {
    return jsonError(503, "Ollama is missing its llama-server files. Repair or reinstall Ollama, then try again.");
  }
  return jsonError(503, "Ollama could not start the local model. Check Ollama's server log and try again.");
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Sign in to use the form assistant.");

  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { formId?: unknown; prompt?: unknown; form?: unknown } | null;
  if (typeof input?.formId !== "string" || input.formId.length > 64) return jsonError(400, "Choose a valid form.");
  if (typeof input.prompt !== "string" || !input.prompt.trim() || input.prompt.trim().length > 1200) return jsonError(400, "Enter a request of up to 1,200 characters.");
  const owned = await getOwnedForm(user.id, input.formId);
  if (!owned) return jsonError(404, "Form not found.");
  const current = parseFormDefinition(input.form);
  if (!current.ok) return jsonError(400, "The current form could not be read. Save or reload it, then try again.");

  if (!rateLimit(`ai-form:${user.id}`, 8, 10 * 60_000).ok)
    return jsonError(429, "You've reached the form assistant limit. Please try again in a few minutes.");

  const requestText = input.prompt.trim();
  const history = await loadAssistantHistory(user.id, input.formId, 12);
  const reply = async (message: string, form?: FormDefinition) => {
    await saveAssistantExchange(user.id, input.formId as string, requestText, message);
    return Response.json({ reply: message, ...(form ? { form } : {}) });
  };
  if (isReadabilityRequest(requestText)) {
    const repaired = repairFormReadability(current.value, 7);
    if (repaired.changes.length) {
      const validatedRepair = parseFormDefinition(repaired.form);
      if (!validatedRepair.ok) return jsonError(502, "The text contrast repair could not be applied. Please try again.");
      return reply(`I ${repaired.changes.join(", and ")}. Save the form when it looks right.`, validatedRepair.value);
    }
  }
  const substantiveWords = requestText.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/u)
    .filter((word) => word && !/^(?:please|kindly)$/i.test(word));
  if (substantiveWords.length <= 1 && /^(?:more|less|again|same|that|it)$/i.test(requestText) && history.at(-1)?.role !== "assistant") {
    return reply("What would you like me to change? Tell me the part of the form and the result you want.");
  }

  const formContext = {
    title: current.value.title,
    description: current.value.description,
    submitLabel: current.value.submitLabel,
    hasBackgroundImage: Boolean(current.value.background),
    theme: current.value.theme,
    fields: current.value.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      helpText: field.helpText,
      required: field.required,
      options: field.options,
      style: field.style,
      showWhen: field.showWhen,
    })),
  };
  let ollamaUrl: URL;
  try {
    ollamaUrl = new URL(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434");
    if (ollamaUrl.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(ollamaUrl.hostname) || ollamaUrl.username || ollamaUrl.password || (ollamaUrl.pathname !== "/" && ollamaUrl.pathname !== "")) {
      return jsonError(503, "OLLAMA_BASE_URL must point to a local Ollama server, such as http://127.0.0.1:11434.");
    }
  } catch {
    return jsonError(503, "OLLAMA_BASE_URL is not a valid local Ollama address.");
  }

  const model = process.env.OLLAMA_MODEL || "qwen3:4b";
  let planResponse: Response;
  try {
    planResponse = await fetch(new URL("/api/chat", ollamaUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        keep_alive: "10m",
        options: { temperature: 0, num_predict: 450, num_ctx: 8192 },
        format: editPlanJsonSchema,
        messages: [
          { role: "system", content: `${planSystemPrompt()} Product help guide: ${FORMYST_HELP_GUIDE}` },
          { role: "user", content: JSON.stringify({ conversation: history, currentForm: formContext, request: requestText }) },
        ],
      }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return jsonError(503, "The local AI model is unavailable. Start Ollama and download the configured model, then try again.");
  }
  if (!planResponse.ok) return ollamaFailure(planResponse);
  let plan;
  try {
    const result = await planResponse.json() as { message?: { content?: string } };
    const parsed = editPlanSchema.safeParse(JSON.parse(result.message?.content ?? ""));
    const validated = parsed.success ? validateEditPlan(parsed.data) : null;
    plan = validated ? refineEverydayPlan(resolveGlassFollowUp(includeNamedThemeAreas(reconcileGlassDirection(validated), requestText), requestText, history), requestText) : null;
  } catch {
    plan = null;
  }
  if (!plan) return jsonError(502, "The assistant could not interpret that request. Please rephrase it.");
  if (plan.action === "help") {
    const help = await answerSiteHelp(requestText, history);
    if (!help.ok) return help;
    const data = await help.json() as { reply: string };
    return reply(data.reply);
  }
  if (plan.action === "clarify") return reply(plan.reply.trim() || "What part of the form would you like me to change?");

  const outputSchema = scopedProposalSchema(plan.scopes, plan.themeAreas);
  const outputJsonSchema = { ...z.toJSONSchema(outputSchema) };
  delete outputJsonSchema.$schema;
  const editMessages = [
    { role: "system", content: formEditSystemPrompt() },
    { role: "user", content: JSON.stringify({ originalRequest: requestText, conversation: history, instruction: plan.instruction, scopes: plan.scopes, themeAreas: plan.themeAreas, currentForm: formContext }) },
  ];
  const editPayload = {
    model,
    stream: false,
    think: false,
    keep_alive: "10m",
    options: { temperature: 0, num_predict: Math.min(3_200, 500 + current.value.fields.length * 100), num_ctx: 8192 },
    format: outputJsonSchema,
  };
  const sendEdit = (messages: typeof editMessages) => fetch(new URL("/api/chat", ollamaUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...editPayload, messages }),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(120_000),
  });

  let response: Response;
  try {
    response = await sendEdit(editMessages);
  } catch {
    return jsonError(503, "The local AI model is unavailable. Start Ollama and download the configured model, then try again.");
  }
  try {
    if (!response.ok) return ollamaFailure(response);

    const result = await response.json() as {
      message?: { content?: string };
    };
    let outputText = result.message?.content ?? "";
    let proposed: z.infer<typeof proposalSchema> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      let feedback = "The reply was not valid JSON.";
      try {
        const rawPatch = normalizePatchColors(JSON.parse(outputText));
        const scoped = outputSchema.safeParse(rawPatch);
        const generated = proposalSchema.safeParse(rawPatch);
        if (scoped.success && generated.success) {
          if (proposalWouldChange(current.value, generated.data, glassDirectionFromPlan(plan))) {
            proposed = generated.data;
            break;
          }
          feedback = "Your patch uses the form's current values and makes no visible change. Choose a different value in the requested direction or a related control within the allowed scopes.";
        } else {
          const issues = !scoped.success ? scoped.error.issues : !generated.success ? generated.error.issues : [];
          feedback = issues.slice(0, 4).map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
        }
      } catch {
        // The corrective call below includes the response for the model to repair.
      }
      if (attempt === 1) break;
      const retry = await sendEdit([
        ...editMessages,
        { role: "assistant", content: outputText.slice(0, 3_500) },
        { role: "user", content: `Repair your JSON patch. ${feedback} Return only the corrected JSON object. Keep the same requested edit and scopes.` },
      ]);
      if (!retry.ok) return ollamaFailure(retry);
      const retried = await retry.json() as { message?: { content?: string } };
      outputText = retried.message?.content ?? "";
    }
    if (!proposed) return jsonError(502, "The assistant could not produce a valid edit for this request. Please rephrase it.");
    const themePatch = completeThemePatch(proposed.theme ?? {}, current.value.theme, glassDirectionFromPlan(plan));
    const fieldStyle = proposed.fieldStyle;
    const fields = current.value.fields.map((field) => fieldStyle
      ? { ...field, style: { ...FIELD_STYLE_DEFAULTS, ...field.style, ...fieldStyle } }
      : { ...field });
    for (const change of proposed.fields ?? []) {
      if (change.action === "add") {
        if (!change.type || !change.label?.trim()) return jsonError(502, "The assistant returned an incomplete field. Please try again.");
        if (CHOICE_TYPES.includes(change.type) && !change.options?.length) return reply(`Which choices should "${change.label.trim()}" offer?`);
        if (fields.length >= MAX_FIELDS) return jsonError(400, `Forms can have at most ${MAX_FIELDS} fields.`);
        const field = createField(change.type);
        field.label = change.label.trim();
        if (change.placeholder !== undefined) field.placeholder = change.placeholder;
        if (change.helpText !== undefined) field.helpText = change.helpText;
        if (change.required !== undefined) field.required = change.required;
        if (change.style) field.style = { ...FIELD_STYLE_DEFAULTS, ...change.style };
        if (change.options && CHOICE_TYPES.includes(change.type)) {
          field.options = change.options.map((label) => ({ id: newId("o"), label }));
        }
        fields.push(field);
        continue;
      }

      if (!change.id) return jsonError(502, "The assistant returned an incomplete field change. Please try again.");
      const index = fields.findIndex((field) => field.id === change.id);
      if (index < 0) return jsonError(502, "The assistant referenced a field that is no longer in this form. Please try again.");
      if (change.action === "remove") {
        fields.splice(index, 1);
        continue;
      }
      if (change.action === "move") {
        if (change.toIndex === undefined || change.toIndex >= fields.length) return jsonError(502, "The assistant returned an invalid question position. Please try again.");
        const [moved] = fields.splice(index, 1);
        fields.splice(change.toIndex, 0, moved);
        continue;
      }

      const field = fields[index];
      const changedType = change.type !== undefined && change.type !== field.type;
      const nextType = change.type ?? field.type;
      if (changedType && CHOICE_TYPES.includes(nextType) && !CHOICE_TYPES.includes(field.type) && !change.options?.length) {
        return reply(`Which choices should "${change.label?.trim() || field.label}" offer?`);
      }
      const typeDefaults = changedType ? createField(nextType) : null;
      fields[index] = {
        ...field,
        type: nextType,
        ...(change.label !== undefined ? { label: change.label } : {}),
        ...(change.placeholder !== undefined ? { placeholder: change.placeholder } : changedType ? { placeholder: typeDefaults!.placeholder } : {}),
        ...(change.helpText !== undefined ? { helpText: change.helpText } : {}),
        ...(change.required !== undefined ? { required: change.required } : {}),
        ...(change.options !== undefined && CHOICE_TYPES.includes(nextType) ? {
          options: change.options.map((label, optionIndex) => ({
            id: field.options[optionIndex]?.id ?? newId("o"),
            label,
          })),
        } : changedType ? { options: CHOICE_TYPES.includes(nextType) ? CHOICE_TYPES.includes(field.type) ? field.options : typeDefaults!.options : [] } : {}),
        ...(change.style ? { style: { ...FIELD_STYLE_DEFAULTS, ...field.style, ...change.style } } : {}),
      };
    }

    const validated = parseFormDefinition({
      ...current.value,
      ...(proposed.title !== undefined ? { title: proposed.title } : {}),
      ...(proposed.description !== undefined ? { description: proposed.description } : {}),
      ...(proposed.submitLabel !== undefined ? { submitLabel: proposed.submitLabel } : {}),
      theme: { ...current.value.theme, ...themePatch },
      fields,
    });
    if (!validated.ok) return jsonError(502, "The assistant's edit needs correction. Try a more specific request.");
    const nextForm = plan.themeAreas.includes("whole")
      ? repairFormReadability(validated.value).form
      : validated.value;
    const changes: string[] = [];
    const changedThemeKeys = Object.keys(nextForm.theme).filter((key) =>
      JSON.stringify(nextForm.theme[key as keyof typeof nextForm.theme]) !==
      JSON.stringify(current.value.theme[key as keyof typeof current.value.theme]),
    );
    if (changedThemeKeys.includes("cardMaterial")) {
      changes.push(nextForm.theme.cardMaterial === "glass" ? "gave the form card a frosted-glass finish" : "changed the form card to a solid finish");
    }
    if (changedThemeKeys.includes("glassOpacity")) changes.push(`set glass opacity to ${Math.round(nextForm.theme.glassOpacity * 100)}%`);
    if (changedThemeKeys.includes("accent")) changes.push("updated the accent palette");
    if (changedThemeKeys.some((key) => key === "pageBg" || key === "cardBg" || key === "surface")) changes.push("refined the page and card backgrounds");
    if (changedThemeKeys.some((key) => key === "font" || key === "fontCustom")) changes.push("updated the typography");
    if (changedThemeKeys.includes("radius")) changes.push("updated the corner style");
    if (changedThemeKeys.some((key) => key.startsWith("button"))) changes.push("refined the submit button");
    const oldById = new Map(current.value.fields.map((field) => [field.id, field]));
    const nextById = new Map(nextForm.fields.map((field) => [field.id, field]));
    const addedFields = nextForm.fields.filter((field) => !oldById.has(field.id));
    const removedFields = current.value.fields.filter((field) => !nextById.has(field.id));
    const updatedFields = nextForm.fields.filter((field) => {
      const previous = oldById.get(field.id);
      return previous && JSON.stringify(previous) !== JSON.stringify(field);
    });
    if (addedFields.length) changes.push(`added ${addedFields.map((field) => field.label).join(", ")}`);
    if (removedFields.length) changes.push(`removed ${removedFields.map((field) => field.label).join(", ")}`);
    if (updatedFields.length) changes.push(`restyled or updated ${updatedFields.map((field) => field.label).join(", ")}`);
    const oldIds = current.value.fields.map((field) => field.id);
    const newIds = nextForm.fields.map((field) => field.id);
    if (oldIds.length === newIds.length && oldIds.every((id) => newIds.includes(id)) && oldIds.join("|") !== newIds.join("|")) changes.push("reordered the questions");
    if (proposed.title !== undefined && nextForm.title !== current.value.title) changes.push("updated the form title");
    if (proposed.description !== undefined && nextForm.description !== current.value.description) changes.push("updated the form description");
    if (proposed.submitLabel !== undefined && nextForm.submitLabel !== current.value.submitLabel) changes.push("updated the submit label");
    if (!changes.length) return jsonError(502, "The assistant did not make any changes. Try a more specific request.");
    return reply(`I ${changes.join(", and ")}. Save the form when it looks right.`, nextForm);
  } catch {
    return jsonError(502, "The local AI model returned an invalid edit. Try again with a simpler request.");
  }
}

import { z } from "zod";

/**
 * Shared (isomorphic) form types, schemas and validation.
 * This module is imported by both server code and client components, so it must
 * not depend on any Node-only API.
 */

export const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "date",
  "url",
  "dropdown",
  "radio",
  "checkbox",
  "textarea",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  url: "Website URL",
  dropdown: "Dropdown",
  radio: "Radio buttons",
  checkbox: "Checkboxes",
  textarea: "Paragraph",
};

export const CHOICE_TYPES: readonly FieldType[] = ["dropdown", "radio", "checkbox"];

export function isChoiceType(type: FieldType): boolean {
  return CHOICE_TYPES.includes(type);
}

export type FormOption = { id: string; label: string };
export type FormVisibilityRule = { sourceFieldId: string; optionId: string };

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  options: FormOption[];
  /** CSS overrides scoped to this field only. */
  customCss: string;
  showWhen?: FormVisibilityRule;
  style?: FormFieldStyle;
};

/* --------------------------------- theme --------------------------------- */

export const THEME_RADIUSES = ["square", "soft", "round", "pill"] as const;
export type ThemeRadius = (typeof THEME_RADIUSES)[number];

export const THEME_RADIUS_LABELS: Record<ThemeRadius, string> = {
  square: "Square",
  soft: "Soft",
  round: "Rounded",
  pill: "Pill",
};

export const THEME_RADIUS_VALUES: Record<ThemeRadius, string> = {
  square: "2px",
  soft: "6px",
  round: "12px",
  pill: "999px",
};

export const THEME_SURFACES = ["light", "dark"] as const;
export type ThemeSurface = (typeof THEME_SURFACES)[number];

export const THEME_CARD_MATERIALS = ["solid", "glass"] as const;
export type ThemeCardMaterial = (typeof THEME_CARD_MATERIALS)[number];
export const THEME_CARD_MATERIAL_LABELS: Record<ThemeCardMaterial, string> = {
  solid: "Solid",
  glass: "Frosted glass",
};

export const THEME_SURFACE_LABELS: Record<ThemeSurface, string> = {
  light: "Light",
  dark: "Dark",
};

export const THEME_FONTS = ["sans", "serif", "mono"] as const;
export type ThemeFont = (typeof THEME_FONTS)[number];

export const THEME_FONT_LABELS: Record<ThemeFont, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
};

export const THEME_BUTTON_WIDTHS = ["auto", "full", "custom"] as const;
export type ThemeButtonWidth = (typeof THEME_BUTTON_WIDTHS)[number];

export const THEME_BUTTON_LABELS: Record<ThemeButtonWidth, string> = {
  auto: "Auto",
  full: "Full width",
  custom: "Custom",
};

export const THEME_BUTTON_SHAPES = ["auto", "square", "soft", "round", "pill"] as const;
export type ThemeButtonShape = (typeof THEME_BUTTON_SHAPES)[number];
export const THEME_BUTTON_SHAPE_LABELS: Record<ThemeButtonShape, string> = {
  auto: "Match form",
  square: "Square",
  soft: "Soft",
  round: "Rounded",
  pill: "Pill",
};

export const THEME_BUTTON_SIZES = ["regular", "large", "custom"] as const;
export type ThemeButtonSize = (typeof THEME_BUTTON_SIZES)[number];
export const THEME_BUTTON_SIZE_LABELS: Record<ThemeButtonSize, string> = {
  regular: "Regular",
  large: "Large",
  custom: "Custom",
};

export const THEME_BUTTON_ALIGNMENTS = ["auto", "left", "center", "right"] as const;
export type ThemeButtonAlignment = (typeof THEME_BUTTON_ALIGNMENTS)[number];
export const THEME_BUTTON_ALIGNMENT_LABELS: Record<ThemeButtonAlignment, string> = {
  auto: "Match form",
  left: "Left",
  center: "Center",
  right: "Right",
};

export const THEME_ALIGNMENTS = ["left", "center"] as const;
export type ThemeAlignment = (typeof THEME_ALIGNMENTS)[number];

export const THEME_ALIGNMENT_LABELS: Record<ThemeAlignment, string> = {
  left: "Left",
  center: "Centered",
};

export const FIELD_STYLE_RADII = ["auto", ...THEME_RADIUSES] as const;
export type FieldStyleRadius = (typeof FIELD_STYLE_RADII)[number];
export const FIELD_STYLE_RADIUS_LABELS: Record<FieldStyleRadius, string> = {
  auto: "Match form", square: "Square", soft: "Soft", round: "Rounded", pill: "Pill",
};
export const FIELD_SIZES = ["small", "regular", "large"] as const;
export type FieldSize = (typeof FIELD_SIZES)[number];
export const FIELD_SIZE_LABELS: Record<FieldSize, string> = {
  small: "Small", regular: "Regular", large: "Large",
};
export const FIELD_BORDER_WIDTHS = ["auto", "thin", "medium", "thick"] as const;
export type FieldBorderWidth = (typeof FIELD_BORDER_WIDTHS)[number];
export const FIELD_BORDER_WIDTH_LABELS: Record<FieldBorderWidth, string> = {
  auto: "Match form", thin: "Thin", medium: "Medium", thick: "Thick",
};

export type FormFieldStyle = {
  labelColor: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  accent: string;
  radius: FieldStyleRadius;
  size: FieldSize;
  borderWidth: FieldBorderWidth;
};

export const FIELD_STYLE_DEFAULTS: FormFieldStyle = {
  labelColor: "", inputBg: "", inputText: "", inputBorder: "", accent: "",
  radius: "auto", size: "regular", borderWidth: "auto",
};

export const FIELD_COLOR_PRESETS: readonly ThemeColorPreset[] = [
  { label: "Ink", hex: "#0f172a" }, { label: "Slate", hex: "#475569" },
  { label: "Copper", hex: "#b85c3a" }, { label: "Moss", hex: "#667c4a" },
  { label: "Aubergine", hex: "#78536f" }, { label: "Garnet", hex: "#9f3f55" },
  { label: "White", hex: "#ffffff" },
];

export type AccentPreset = { id: string; label: string; base: string };

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "copper", label: "Copper", base: "#b85c3a" },
  { id: "moss", label: "Moss", base: "#667c4a" },
  { id: "aubergine", label: "Aubergine", base: "#78536f" },
  { id: "ochre", label: "Ochre", base: "#b67a2c" },
  { id: "pine", label: "Pine", base: "#407365" },
  { id: "garnet", label: "Garnet", base: "#9f3f55" },
  { id: "slate", label: "Slate", base: "#505967" },
  { id: "charcoal", label: "Charcoal", base: "#34343a" },
];

export type FormTheme = {
  /** Accent color as a 6-digit hex, e.g. "#b85c3a". */
  accent: string;
  /** Corner style for inputs, buttons and cards. */
  radius: ThemeRadius;
  /** Page/card surface. */
  surface: ThemeSurface;
  /** Whether the form card uses a solid or frosted glass surface. */
  cardMaterial: ThemeCardMaterial;
  /** Opacity of the form card when the glass material is selected. */
  glassOpacity: number;
  /** Typeface for the public form. */
  font: ThemeFont;
  /** Custom page background (" = follow the surface preset). */
  pageBg: string;
  /** Custom card background (" = follow the surface preset). */
  cardBg: string;
  /** Custom CSS font-family stack; overrides `font` when non-empty. */
  fontCustom: string;
  /** Submit button width. */
  button: ThemeButtonWidth;
  buttonWidthCustom: string;
  /** Empty colors follow the accent and use automatic contrast. */
  buttonColor: string;
  buttonTextColor: string;
  buttonShape: ThemeButtonShape;
  buttonSize: ThemeButtonSize;
  buttonFontSizeCustom: number;
  buttonPaddingYCustom: number;
  buttonPaddingXCustom: number;
  buttonAlign: ThemeButtonAlignment;
  /** Alignment of the form header and submit button. */
  align: ThemeAlignment;
};

export const THEME_DEFAULTS: FormTheme = {
  accent: "#b85c3a",
  radius: "soft",
  surface: "light",
  cardMaterial: "solid",
  glassOpacity: 0.68,
  font: "sans",
  pageBg: "",
  cardBg: "",
  fontCustom: "",
  button: "auto",
  buttonWidthCustom: "240px",
  buttonColor: "",
  buttonTextColor: "",
  buttonShape: "auto",
  buttonSize: "regular",
  buttonFontSizeCustom: 16,
  buttonPaddingYCustom: 12,
  buttonPaddingXCustom: 20,
  buttonAlign: "auto",
  align: "left",
};

export type ThemeColorPreset = { label: string; hex: string };

/** Quick picks for the custom page background ("" = Auto is always first in the UI). */
export const PAGE_BG_PRESETS: readonly ThemeColorPreset[] = [
  { label: "White", hex: "#ffffff" },
  { label: "Soft slate", hex: "#f1f5f9" },
  { label: "Warm sand", hex: "#faf6f0" },
  { label: "Blush", hex: "#fdf2f4" },
  { label: "Mint", hex: "#f0faf6" },
  { label: "Midnight", hex: "#0b1120" },
];

/** Quick picks for the custom card background. */
export const CARD_BG_PRESETS: readonly ThemeColorPreset[] = [
  { label: "White", hex: "#ffffff" },
  { label: "Soft slate", hex: "#f8fafc" },
  { label: "Cream", hex: "#fffdf7" },
  { label: "Blush", hex: "#fff5f7" },
  { label: "Mint", hex: "#f4fbf8" },
  { label: "Charcoal", hex: "#1e293b" },
];

export type FormDefinition = {
  title: string;
  description: string;
  submitLabel: string;
  /** Branding: image URL (https://…) or uploaded file (data:image/…). "" = none. */
  logo: string;
  /** Banner image at the top of the form. "" = none. */
  cover: string;
  background: string;
  /** Owner CSS overrides, scoped to this form in the builder and public view. */
  customCss: string;
  backgroundCss: string;
  headerCss: string;
  buttonCss: string;
  /** Show the "Powered by Formyst" line under the form card. */
  poweredBy: boolean;
  /** Thank-you heading shown after submit. "" = hidden. */
  successTitle: string;
  /** Thank-you body shown after submit. "" = hidden. */
  successMessage: string;
  /** "Submit another response" button text. "" = hidden. */
  successButton: string;
  theme: FormTheme;
  fields: FormField[];
};

export const DEFAULT_SUCCESS_TITLE = "Thank you!";
export const DEFAULT_SUCCESS_MESSAGE =
  "Your response has been recorded. We appreciate the time you took to reply.";
export const DEFAULT_SUCCESS_BUTTON = "Submit another response";

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export const MAX_FIELDS = 50;
export const MAX_OPTIONS = 30;
export const MAX_ANSWER_LENGTH = 5000;
/** Cap for stored branding images (base64 length ≈ file size * 4 / 3). */
export const MAX_IMAGE_LENGTH = 1_200_000;
/** Client-side upload cap per image file, in bytes. */
export const MAX_IMAGE_FILE_BYTES = 600 * 1024;
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export function newId(prefix = "f"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function createField(type: FieldType): FormField {
  const field: FormField = {
    id: newId(),
    type,
    label: FIELD_TYPE_LABELS[type],
    placeholder: "",
    helpText: "",
    required: false,
    options: [],
    customCss: "",
  };
  if (type === "email") field.placeholder = "you@example.com";
  if (type === "phone") field.placeholder = "+1 555 000 0000";
  if (type === "dropdown") {
    field.placeholder = "Choose an option";
    field.options = [
      { id: newId("o"), label: "Option 1" },
      { id: newId("o"), label: "Option 2" },
    ];
  }
  if (type === "radio" || type === "checkbox") {
    field.options = [
      { id: newId("o"), label: "Option 1" },
      { id: newId("o"), label: "Option 2" },
    ];
  }
  return field;
}

export function defaultFormDefinition(): FormDefinition {
  return {
    title: "Contact us",
    description:
      "Have a question or feedback? Drop us a note and we will get back to you.",
    submitLabel: "Submit",
    logo: "",
    cover: "",
    background: "",
    customCss: "",
    backgroundCss: "",
    headerCss: "",
    buttonCss: "",
    poweredBy: true,
    successTitle: DEFAULT_SUCCESS_TITLE,
    successMessage: DEFAULT_SUCCESS_MESSAGE,
    successButton: DEFAULT_SUCCESS_BUTTON,
    theme: { ...THEME_DEFAULTS },
    fields: [
      {
        id: "f_name",
        type: "text",
        label: "Your name",
        placeholder: "Jane Doe",
        helpText: "",
        required: true,
        options: [],
        customCss: "",
      },
      {
        id: "f_email",
        type: "email",
        label: "Email address",
        placeholder: "jane@example.com",
        helpText: "",
        required: true,
        options: [],
        customCss: "",
      },
      {
        id: "f_message",
        type: "textarea",
        label: "Message",
        placeholder: "Tell us how we can help…",
        helpText: "",
        required: true,
        options: [],
        customCss: "",
      },
    ],
  };
}

/* ------------------------------- zod schemas ------------------------------- */

const optionSchema = z.object({
  id: z.string().regex(/^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_-]{1,64}$/),
  label: z.string().trim().min(1, "Option label is required").max(200),
});

const visibilityRuleSchema = z.object({
  sourceFieldId: z.string().regex(/^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_-]{1,64}$/),
  optionId: z.string().regex(/^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_-]{1,64}$/),
});

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const optionalColorSchema = z.string().regex(/^(?:$|#[0-9a-fA-F]{6})$/);
const fieldStyleSchema = z.object({
  labelColor: optionalColorSchema.catch(FIELD_STYLE_DEFAULTS.labelColor),
  inputBg: optionalColorSchema.catch(FIELD_STYLE_DEFAULTS.inputBg),
  inputText: optionalColorSchema.catch(FIELD_STYLE_DEFAULTS.inputText),
  inputBorder: optionalColorSchema.catch(FIELD_STYLE_DEFAULTS.inputBorder),
  accent: optionalColorSchema.catch(FIELD_STYLE_DEFAULTS.accent),
  radius: z.enum(FIELD_STYLE_RADII).catch(FIELD_STYLE_DEFAULTS.radius),
  size: z.enum(FIELD_SIZES).catch(FIELD_STYLE_DEFAULTS.size),
  borderWidth: z.enum(FIELD_BORDER_WIDTHS).catch(FIELD_STYLE_DEFAULTS.borderWidth),
}).catch(FIELD_STYLE_DEFAULTS);

const fieldSchema = z.object({
  id: z.string().regex(/^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_-]{1,64}$/),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1, "Field label is required").max(300),
  placeholder: z.string().max(300).optional(),
  helpText: z.string().max(500).optional(),
  required: z.boolean().optional(),
  options: z.array(optionSchema).max(MAX_OPTIONS).optional(),
  customCss: z.string().max(5_000, "Field CSS must be 5,000 characters or fewer").optional(),
  showWhen: visibilityRuleSchema.optional(),
  style: fieldStyleSchema.optional(),
});

// Lenient by design: a corrupt/legacy theme must never make the whole form
// fail to load — bad values fall back to the default instead.
const themeSchema = z
  .object({
    accent: z.string().regex(HEX_COLOR_RE, "Use a hex color like #b85c3a").catch(THEME_DEFAULTS.accent),
    radius: z.enum(THEME_RADIUSES).catch(THEME_DEFAULTS.radius),
    surface: z.enum(THEME_SURFACES).catch(THEME_DEFAULTS.surface),
    cardMaterial: z.enum(THEME_CARD_MATERIALS).catch(THEME_DEFAULTS.cardMaterial),
    glassOpacity: z.number().min(0.2).max(0.9).catch(THEME_DEFAULTS.glassOpacity),
    font: z.enum(THEME_FONTS).catch(THEME_DEFAULTS.font),
    pageBg: z
      .string()
      .regex(/^(?:$|#[0-9a-fA-F]{6})$/, "Use a hex color like #ffffff or leave it empty")
      .catch(THEME_DEFAULTS.pageBg),
    cardBg: z
      .string()
      .regex(/^(?:$|#[0-9a-fA-F]{6})$/, "Use a hex color like #ffffff or leave it empty")
      .catch(THEME_DEFAULTS.cardBg),
    fontCustom: z.string().max(300).regex(/^[\w\s,"'-]*$/).catch(THEME_DEFAULTS.fontCustom),
    button: z.enum(THEME_BUTTON_WIDTHS).catch(THEME_DEFAULTS.button),
    buttonWidthCustom: z.string().regex(/^\d{1,4}(?:px|rem|em|%)$/).catch(THEME_DEFAULTS.buttonWidthCustom).optional(),
    buttonColor: z.string().regex(/^(?:$|#[0-9a-fA-F]{6})$/).catch(THEME_DEFAULTS.buttonColor),
    buttonTextColor: z.string().regex(/^(?:$|#[0-9a-fA-F]{6})$/).catch(THEME_DEFAULTS.buttonTextColor),
    buttonShape: z.enum(THEME_BUTTON_SHAPES).catch(THEME_DEFAULTS.buttonShape),
    buttonSize: z.enum(THEME_BUTTON_SIZES).catch(THEME_DEFAULTS.buttonSize),
    buttonFontSizeCustom: z.number().int().min(10).max(32).catch(THEME_DEFAULTS.buttonFontSizeCustom).optional(),
    buttonPaddingYCustom: z.number().int().min(4).max(32).catch(THEME_DEFAULTS.buttonPaddingYCustom).optional(),
    buttonPaddingXCustom: z.number().int().min(8).max(48).catch(THEME_DEFAULTS.buttonPaddingXCustom).optional(),
    buttonAlign: z.enum(THEME_BUTTON_ALIGNMENTS).catch(THEME_DEFAULTS.buttonAlign),
    align: z.enum(THEME_ALIGNMENTS).catch(THEME_DEFAULTS.align),
  })
  .catch(THEME_DEFAULTS);

// Branding images: an https URL or an uploaded data:image/… payload.
// Catch-based like the theme so corrupt/oversized stored values degrade to
// "no image" instead of hiding the whole form on load.
const imageSchema = z
  .string()
  .max(MAX_IMAGE_LENGTH, "Image is too large")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("data:image/") ||
      /^https?:\/\/\S+$/.test(value),
    "Must be an image URL (https://…) or an uploaded image",
  )
  .catch("");

export const formDefinitionSchema = z
  .object({
    title: z.string().trim().min(1, "Form title is required").max(200),
    description: z.string().max(2000).optional(),
    submitLabel: z.string().trim().min(1, "Submit button text is required").max(60),
    logo: imageSchema,
    cover: imageSchema,
    background: imageSchema,
    customCss: z.string().max(12_000, "Custom CSS must be 12,000 characters or fewer").optional(),
    backgroundCss: z.string().max(5_000, "Background CSS must be 5,000 characters or fewer").optional(),
    headerCss: z.string().max(5_000, "Header CSS must be 5,000 characters or fewer").optional(),
    buttonCss: z.string().max(5_000, "Button CSS must be 5,000 characters or fewer").optional(),
    poweredBy: z.boolean().optional(),
    successTitle: z.string().max(200).optional(),
    successMessage: z.string().max(1000).optional(),
    successButton: z.string().max(60).optional(),
    theme: themeSchema,
    fields: z.array(fieldSchema).max(MAX_FIELDS, `A form can have at most ${MAX_FIELDS} fields`),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    const fieldsById = new Map(value.fields.map((field) => [field.id, field]));
    value.fields.forEach((field, index) => {
      if (ids.has(field.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate field id",
          path: ["fields", index, "id"],
        });
      }
      ids.add(field.id);

      if (field.showWhen) {
        const source = fieldsById.get(field.showWhen.sourceFieldId);
        if (!source || !(CHOICE_TYPES as readonly string[]).includes(source.type) ||
            !source.options?.some((option) => option.id === field.showWhen?.optionId)) {
          ctx.addIssue({
            code: "custom",
            message: "Choose an existing option from a choice field for this condition.",
            path: ["fields", index, "showWhen"],
          });
        }
        const visited = new Set([field.id]);
        let nextId: string | undefined = field.showWhen.sourceFieldId;
        while (nextId) {
          if (visited.has(nextId)) {
            ctx.addIssue({
              code: "custom",
              message: "Conditions cannot depend on each other in a loop.",
              path: ["fields", index, "showWhen"],
            });
            break;
          }
          visited.add(nextId);
          nextId = fieldsById.get(nextId)?.showWhen?.sourceFieldId;
        }
      }

      if ((CHOICE_TYPES as readonly string[]).includes(field.type)) {
        const options = field.options ?? [];
        if (options.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Choice fields need at least one option",
            path: ["fields", index, "options"],
          });
        }
        const optionIds = new Set<string>();
        options.forEach((option, optionIndex) => {
          if (optionIds.has(option.id)) {
            ctx.addIssue({
              code: "custom",
              message: "Duplicate option id",
              path: ["fields", index, "options", optionIndex, "id"],
            });
          }
          optionIds.add(option.id);
        });
      }
    });
  });

type IssueLike = { path: ReadonlyArray<string | number | symbol>; message: string };

export function issuesToErrors(issues: readonly IssueLike[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    if (!errors[key]) errors[key] = issue.message;
    if (!errors._form) errors._form = issue.message;
  }
  return errors;
}

export function normalizeTheme(input: z.infer<typeof themeSchema> | undefined): FormTheme {
  const theme = input ?? THEME_DEFAULTS;
  return {
    accent: theme.accent.toLowerCase(),
    radius: theme.radius,
    surface: theme.surface,
    cardMaterial: theme.cardMaterial,
    glassOpacity: theme.glassOpacity,
    font: theme.font,
    pageBg: theme.pageBg.toLowerCase(),
    cardBg: theme.cardBg.toLowerCase(),
    fontCustom: theme.fontCustom.trim(),
    button: theme.button,
    buttonWidthCustom: theme.buttonWidthCustom ?? THEME_DEFAULTS.buttonWidthCustom,
    buttonColor: theme.buttonColor.toLowerCase(),
    buttonTextColor: theme.buttonTextColor.toLowerCase(),
    buttonShape: theme.buttonShape,
    buttonSize: theme.buttonSize,
    buttonFontSizeCustom: theme.buttonFontSizeCustom ?? THEME_DEFAULTS.buttonFontSizeCustom,
    buttonPaddingYCustom: theme.buttonPaddingYCustom ?? THEME_DEFAULTS.buttonPaddingYCustom,
    buttonPaddingXCustom: theme.buttonPaddingXCustom ?? THEME_DEFAULTS.buttonPaddingXCustom,
    buttonAlign: theme.buttonAlign,
    align: theme.align,
  };
}

export function normalizeFieldStyle(input: z.infer<typeof fieldStyleSchema> | undefined): FormFieldStyle {
  const style = input ?? FIELD_STYLE_DEFAULTS;
  return {
    labelColor: style.labelColor.toLowerCase(),
    inputBg: style.inputBg.toLowerCase(),
    inputText: style.inputText.toLowerCase(),
    inputBorder: style.inputBorder.toLowerCase(),
    accent: style.accent.toLowerCase(),
    radius: style.radius,
    size: style.size,
    borderWidth: style.borderWidth,
  };
}

export function normalizeFormDefinition(input: z.infer<typeof formDefinitionSchema>): FormDefinition {
  return {
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    submitLabel: input.submitLabel.trim(),
    logo: input.logo.trim(),
    cover: input.cover.trim(),
    background: input.background.trim(),
    customCss: (input.customCss ?? "").trim(),
    backgroundCss: (input.backgroundCss ?? "").trim(),
    headerCss: (input.headerCss ?? "").trim(),
    buttonCss: (input.buttonCss ?? "").trim(),
    poweredBy: input.poweredBy ?? true,
    successTitle: (input.successTitle ?? DEFAULT_SUCCESS_TITLE).trim(),
    successMessage: (input.successMessage ?? DEFAULT_SUCCESS_MESSAGE).trim(),
    successButton: (input.successButton ?? DEFAULT_SUCCESS_BUTTON).trim(),
    theme: normalizeTheme(input.theme),
    fields: input.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label.trim(),
      placeholder: (field.placeholder ?? "").trim(),
      helpText: (field.helpText ?? "").trim(),
      required: Boolean(field.required),
      options: (CHOICE_TYPES as readonly string[]).includes(field.type)
        ? (field.options ?? []).map((option) => ({ id: option.id, label: option.label.trim() }))
        : [],
      style: normalizeFieldStyle(field.style),
      customCss: (field.customCss ?? "").trim(),
      ...(field.showWhen ? { showWhen: { ...field.showWhen } } : {}),
    })),
  };
}

export function parseFormDefinition(
  input: unknown,
): { ok: true; value: FormDefinition } | { ok: false; errors: Record<string, string> } {
  const parsed = formDefinitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues) };
  return { ok: true, value: normalizeFormDefinition(parsed.data) };
}

/**
 * Best-effort theme parse for stored JSON: corrupt or legacy values fall back
 * to the defaults instead of failing (the schema itself is catch-based).
 */
export function parseTheme(input: unknown): FormTheme {
  const parsed = themeSchema.safeParse(input);
  return normalizeTheme(parsed.success ? parsed.data : undefined);
}

/** A hidden source cannot reveal a dependent field, even if an old answer remains in state. */
export function visibleFieldIds(form: FormDefinition, values: Record<string, unknown>): Set<string> {
  const fieldsById = new Map(form.fields.map((field) => [field.id, field]));
  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();

  function isVisible(id: string): boolean {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return false;
    const field = fieldsById.get(id);
    if (!field) return false;
    visiting.add(id);
    const rule = field.showWhen;
    const answer = rule ? values[rule.sourceFieldId] : undefined;
    const matches = !rule || (isVisible(rule.sourceFieldId) &&
      (Array.isArray(answer) ? answer.includes(rule.optionId) : answer === rule.optionId));
    visiting.delete(id);
    memo.set(id, matches);
    return matches;
  }

  return new Set(form.fields.filter((field) => isVisible(field.id)).map((field) => field.id));
}

/* ---------------------------- submission validation ---------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{4,24}$/;

export type SubmissionValidation =
  | { ok: true; answers: Answers }
  | { ok: false; errors: Record<string, string> };

/**
 * Validates submitted answers against the stored form definition.
 * Used by the public form (client-side) and the API route (server-side).
 */
export function validateSubmission(form: FormDefinition, raw: unknown): SubmissionValidation {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { _form: "Invalid submission." } };
  }
  const input = raw as Record<string, unknown>;
  const answers: Answers = {};
  const errors: Record<string, string> = {};
  const visible = visibleFieldIds(form, input);

  for (const field of form.fields) {
    if (!visible.has(field.id)) continue;
    const value = input[field.id];

    if (field.type === "checkbox") {
      const rawList = Array.isArray(value)
        ? value
        : typeof value === "string" && value.length > 0
          ? [value]
          : [];
      const list = rawList.filter((item): item is string => typeof item === "string");
      const validIds = new Set(field.options.map((option) => option.id));
      if (list.length > field.options.length || new Set(list).size !== list.length ||
          list.some((item) => !validIds.has(item))) {
        errors[field.id] = "Select one of the available options.";
        continue;
      }
      if (field.required && list.length === 0) {
        errors[field.id] = "Select at least one option.";
        continue;
      }
      answers[field.id] = list;
      continue;
    }

    if (value != null && typeof value !== "string") {
      errors[field.id] = "Invalid answer.";
      continue;
    }
    const text = typeof value === "string" ? value.trim() : "";

    if (field.type === "dropdown" || field.type === "radio") {
      if (!text) {
        if (field.required) {
          errors[field.id] = "This field is required.";
          continue;
        }
        answers[field.id] = "";
        continue;
      }
      if (!field.options.some((option) => option.id === text)) {
        errors[field.id] = "Select one of the available options.";
        continue;
      }
      answers[field.id] = text;
      continue;
    }

    if (!text) {
      if (field.required) {
        errors[field.id] = "This field is required.";
        continue;
      }
      answers[field.id] = "";
      continue;
    }

    if (text.length > MAX_ANSWER_LENGTH) {
      errors[field.id] = `Please keep your answer under ${MAX_ANSWER_LENGTH} characters.`;
      continue;
    }
    if (field.type === "email" && !EMAIL_RE.test(text)) {
      errors[field.id] = "Enter a valid email address.";
      continue;
    }
    if (field.type === "phone" && !PHONE_RE.test(text)) {
      errors[field.id] = "Enter a valid phone number.";
      continue;
    }
    if (field.type === "number" && (!/^-?(?:\d+)(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text)))) {
      errors[field.id] = "Enter a valid number.";
      continue;
    }
    if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) {
      errors[field.id] = "Enter a valid date.";
      continue;
    }
    if (field.type === "url") {
      try {
        const url = new URL(text);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        errors[field.id] = "Enter a valid website URL.";
        continue;
      }
    }
    answers[field.id] = text;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, answers };
}

export function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (value == null) return "";
  return String(value);
}

/**
 * Formats a stored answer for display/export. Choice answers are stored as
 * option ids, so they are mapped back to their human-readable labels.
 */
export function displayAnswer(field: FormField | undefined, value: unknown): string {
  if (!field || field.options.length === 0) return formatAnswer(value);

  const labelFor = (id: string) => field.options.find((option) => option.id === id)?.label ?? id;

  if (Array.isArray(value)) return value.map(labelFor).join(", ");
  if (typeof value === "string") return value ? labelFor(value) : "";
  return formatAnswer(value);
}

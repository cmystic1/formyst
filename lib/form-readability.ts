import type { FormDefinition, FormFieldStyle } from "./form-schema";

const HEX = /^#[0-9a-fA-F]{6}$/;
const MIN_TEXT_CONTRAST = 4.5;

export function isReadabilityRequest(prompt: string): boolean {
  return /\b(?:readability|readable|unreadable|legibility|illegible|contrast)\b/i.test(prompt) ||
    /\b(?:text|words?|labels?|descriptions?|placeholders?|writing|letters?)\b.{0,80}\b(?:cannot|can.?t|hard|difficult|faint|invisible|not|barely|low|hidden)\b/i.test(prompt) ||
    /\b(?:cannot|can.?t|hard|difficult|barely)\b.{0,50}\b(?:see|read)\b.{0,50}\b(?:text|words?|labels?|descriptions?|placeholders?)\b/i.test(prompt);
}

function validHex(value: string): boolean {
  return HEX.test(value);
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}

function blend(foreground: string, background: string, opacity: number): string {
  const front = rgb(foreground);
  const back = rgb(background);
  return `#${front.map((channel, index) => Math.round(channel * opacity + back[index] * (1 - opacity))
    .toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const linear = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function safestText(backgrounds: string[]): string {
  const choices = ["#0f172a", "#ffffff"];
  return choices.sort((a, b) =>
    Math.min(...backgrounds.map((background) => contrastRatio(b, background))) -
    Math.min(...backgrounds.map((background) => contrastRatio(a, background))))[0];
}

export function bestTextColor(background: string): string {
  return safestText([background]);
}

function minContrast(text: string, backgrounds: string[]): number {
  return Math.min(...backgrounds.map((background) => contrastRatio(text, background)));
}

const DEFAULT_FIELD_STYLE: FormFieldStyle = {
  labelColor: "", inputBg: "", inputText: "", inputBorder: "", accent: "",
  radius: "auto", size: "regular", borderWidth: "auto",
};

/** Repairs unreadable theme and field colors while preserving form content. */
export function repairFormReadability(
  form: FormDefinition,
  minimumContrast = MIN_TEXT_CONTRAST,
): { form: FormDefinition; changes: string[] } {
  const theme = { ...form.theme };
  const changes: string[] = [];
  const unknownBackdrop = Boolean(form.background || form.backgroundCss);
  const pageBg = validHex(theme.pageBg) ? theme.pageBg : theme.surface === "dark" ? "#0f172a" : "#f8fafc";
  const solidCardBg = validHex(theme.cardBg) ? theme.cardBg : theme.surface === "dark" ? "#1e293b" : "#ffffff";
  const darkCard = luminance(solidCardBg) < 0.5;
  const defaultText = darkCard ? "#ffffff" : "#0f172a";
  const defaultMuted = darkCard ? "#f1f5f9" : "#334155";
  const defaultInputBg = darkCard ? "#0f172a" : "#ffffff";
  const defaultInputText = darkCard ? "#f1f5f9" : "#0f172a";

  const cardBackgrounds = () => {
    if (theme.cardMaterial !== "glass") return [solidCardBg];
    const backdrops = unknownBackdrop ? ["#000000", "#ffffff"] : [pageBg];
    return backdrops.map((backdrop) => blend(solidCardBg, backdrop, theme.glassOpacity));
  };
  if (theme.cardMaterial === "glass" &&
      (minContrast(defaultText, cardBackgrounds()) < minimumContrast ||
       minContrast(defaultMuted, cardBackgrounds()) < minimumContrast)) {
    for (const opacity of [0.8, 0.9]) {
      if (theme.glassOpacity < opacity) theme.glassOpacity = opacity;
      if (minContrast(defaultText, cardBackgrounds()) >= minimumContrast &&
          minContrast(defaultMuted, cardBackgrounds()) >= minimumContrast) break;
    }
    if (minContrast(defaultText, cardBackgrounds()) < minimumContrast ||
        minContrast(defaultMuted, cardBackgrounds()) < minimumContrast) theme.cardMaterial = "solid";
    if (theme.glassOpacity !== form.theme.glassOpacity || theme.cardMaterial !== form.theme.cardMaterial) {
      changes.push("improved card contrast against the background");
    }
  }

  const cardColors = cardBackgrounds();
  let fixedLabels = 0;
  let fixedInputText = 0;
  const fields = form.fields.map((field) => {
    const style = { ...DEFAULT_FIELD_STYLE, ...field.style };
    let changed = false;
    const labelColor = validHex(style.labelColor) ? style.labelColor : defaultText;
    if (minContrast(labelColor, cardColors) < minimumContrast) {
      style.labelColor = safestText(cardColors);
      fixedLabels++;
      changed = true;
    }
    let inputBg = validHex(style.inputBg) ? style.inputBg : defaultInputBg;
    const inputText = validHex(style.inputText) ? style.inputText : defaultInputText;
    if (contrastRatio(inputText, inputBg) < minimumContrast) {
      if (contrastRatio(safestText([inputBg]), inputBg) < minimumContrast) {
        inputBg = darkCard ? "#0f172a" : "#ffffff";
        style.inputBg = inputBg;
      }
      style.inputText = safestText([inputBg]);
      fixedInputText++;
      changed = true;
    }
    return changed ? { ...field, style } : field;
  });
  if (fixedLabels) changes.push(`made ${fixedLabels} field label${fixedLabels === 1 ? "" : "s"} readable`);
  if (fixedInputText) changes.push(`improved text contrast in ${fixedInputText} input${fixedInputText === 1 ? "" : "s"}`);

  let buttonBg = validHex(theme.buttonColor) ? theme.buttonColor : theme.accent;
  const buttonText = validHex(theme.buttonTextColor) ? theme.buttonTextColor : safestText([buttonBg]);
  if (contrastRatio(buttonText, buttonBg) < minimumContrast) {
    if (contrastRatio(safestText([buttonBg]), buttonBg) < minimumContrast) {
      buttonBg = "#0f172a";
      theme.buttonColor = buttonBg;
    }
    theme.buttonTextColor = safestText([buttonBg]);
    changes.push("made the submit button text readable");
  }
  return { form: changes.length ? { ...form, theme, fields } : form, changes };
}

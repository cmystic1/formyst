import type { CSSProperties } from "react";
import { FIELD_STYLE_DEFAULTS, THEME_RADIUS_VALUES, type FormFieldStyle, type FormTheme, type ThemeRadius } from "./form-schema";

/**
 * Turns a FormTheme into CSS custom properties consumed by the `.fy-*`
 * component classes in app/globals.css. Isomorphic (no DOM access) so it can
 * run in server components, client components and the live preview alike.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parseHex(hex: string): [number, number, number] {
  const safe = HEX_RE.test(hex) ? hex : "#b85c3a";
  return [
    parseInt(safe.slice(1, 3), 16),
    parseInt(safe.slice(3, 5), 16),
    parseInt(safe.slice(5, 7), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes the color towards white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const target = amount >= 0 ? 255 : 0;
  const t = Math.abs(amount);
  return toHex(r + (target - r) * t, g + (target - g) * t, b + (target - b) * t);
}

function alpha(hex: string, opacity: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Relative luminance (sRGB coefficients), 0 = black, 1 = white. */
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function isCustomColor(value: string): boolean {
  return HEX_RE.test(value);
}

/** Picks white or near-black text for readable contrast on the accent color. */
function onColor(hex: string): string {
  const [r, g, b] = parseHex(hex);
  // Relative luminance approximation (sRGB coefficients).
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

const RADIUS_CARD_VALUES: Record<ThemeRadius, string> = {
  square: "4px",
  soft: "14px",
  round: "20px",
  pill: "32px",
};

const FONT_STACKS: Record<FormTheme["font"], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
};

const SURFACES = {
  light: {
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    text: "#0f172a",
    muted: "#475569",
    label: "#334155",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    inputText: "#0f172a",
    placeholder: "#94a3b8",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerText: "#b91c1c",
    shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  dark: {
    pageBg: "#0f172a",
    cardBg: "#1e293b",
    cardBorder: "#334155",
    text: "#f1f5f9",
    muted: "#94a3b8",
    label: "#e2e8f0",
    inputBg: "#0f172a",
    inputBorder: "#475569",
    inputText: "#f1f5f9",
    placeholder: "#64748b",
    danger: "#f87171",
    dangerSoft: "rgba(248, 113, 113, 0.12)",
    dangerText: "#fca5a5",
    shadow: "0 1px 2px 0 rgb(0 0 0 / 0.30)",
  },
} as const;

export function formThemeStyle(theme: FormTheme): CSSProperties {
  const base = SURFACES[theme.surface];
  const accent = theme.accent.toLowerCase();
  const buttonColor = isCustomColor(theme.buttonColor) ? theme.buttonColor.toLowerCase() : accent;
  const buttonTextColor = isCustomColor(theme.buttonTextColor)
    ? theme.buttonTextColor.toLowerCase() : onColor(buttonColor);
  const buttonRadius = theme.buttonShape === "auto"
    ? THEME_RADIUS_VALUES[theme.radius] : THEME_RADIUS_VALUES[theme.buttonShape];

  // Custom page background replaces the surface preset; "" keeps the preset.
  const pageBg = isCustomColor(theme.pageBg) ? theme.pageBg.toLowerCase() : base.pageBg;

  // Custom card background replaces the surface preset. When set, text/input
  // colors follow the card's luminance so contrast stays readable regardless
  // of which appearance preset is active.
  const customCard = isCustomColor(theme.cardBg);
  const solidCardBg = customCard ? theme.cardBg.toLowerCase() : base.cardBg;
  const surface = customCard ? (luminance(solidCardBg) < 0.5 ? SURFACES.dark : SURFACES.light) : base;
  const isGlass = theme.cardMaterial === "glass";
  // Reference equality: `base`/`surface` are entries of the SURFACES map.
  const contentDark = surface === SURFACES.dark;
  const cardBg = isGlass ? alpha(solidCardBg, contentDark ? 0.72 : 0.68) : solidCardBg;

  // A custom font-family stack wins over the font preset.
  const fontStack = theme.fontCustom.trim() || FONT_STACKS[theme.font];

  const variables: Record<string, string> = {
    "--fy-accent": accent,
    "--fy-accent-hover": shade(accent, -0.14),
    "--fy-accent-active": shade(accent, -0.25),
    "--fy-accent-text": contentDark ? shade(accent, 0.4) : shade(accent, -0.08),
    "--fy-on-accent": onColor(accent),
    "--fy-button-bg": buttonColor,
    "--fy-button-hover": shade(buttonColor, -0.14),
    "--fy-button-active": shade(buttonColor, -0.25),
    "--fy-button-text": buttonTextColor,
    "--fy-button-ring": alpha(buttonColor, 0.18),
    "--fy-button-radius": buttonRadius,
    "--fy-button-padding": theme.buttonSize === "custom"
      ? `${theme.buttonPaddingYCustom}px ${theme.buttonPaddingXCustom}px`
      : theme.buttonSize === "large" ? "0.875rem 1.375rem" : "0.625rem 1rem",
    "--fy-button-font-size": theme.buttonSize === "custom"
      ? `${theme.buttonFontSizeCustom}px`
      : theme.buttonSize === "large" ? "1rem" : "0.875rem",
    "--fy-ring": alpha(accent, 0.18),
    "--fy-soft": alpha(accent, contentDark ? 0.2 : 0.1),
    "--fy-radius": THEME_RADIUS_VALUES[theme.radius],
    "--fy-card-radius": RADIUS_CARD_VALUES[theme.radius],
    "--fy-font": fontStack,
    "--fy-page-bg": pageBg,
    "--fy-card-bg": cardBg,
    "--fy-card-blur": isGlass ? "18px" : "0px",
    "--fy-card-saturation": isGlass ? "1.35" : "1",
    "--fy-card-border": isGlass ? alpha(contentDark ? "#ffffff" : "#ffffff", 0.48) : surface.cardBorder,
    "--fy-card-shadow": isGlass ? "0 22px 70px rgba(30, 41, 59, 0.18)" : surface.shadow,
    "--fy-text": surface.text,
    "--fy-muted": surface.muted,
    "--fy-label": surface.label,
    "--fy-input-bg": surface.inputBg,
    "--fy-input-border": surface.inputBorder,
    "--fy-input-text": surface.inputText,
    "--fy-placeholder": surface.placeholder,
    "--fy-danger": surface.danger,
    "--fy-danger-soft": surface.dangerSoft,
    "--fy-danger-text": surface.dangerText,
  };

  return variables as CSSProperties;
}

export function formFieldStyle(styleInput?: FormFieldStyle): CSSProperties {
  const style = styleInput ?? FIELD_STYLE_DEFAULTS;
  const borderWidths = { auto: "1px", thin: "1px", medium: "2px", thick: "3px" } as const;
  const variables: Record<string, string> = {
    "--fy-field-label": style.labelColor || "var(--fy-label)",
    "--fy-field-bg": style.inputBg || "var(--fy-input-bg)",
    "--fy-field-text": style.inputText || "var(--fy-input-text)",
    "--fy-field-border": style.inputBorder || "var(--fy-input-border)",
    "--fy-field-accent": style.accent || "var(--fy-accent)",
    "--fy-field-radius": style.radius === "auto" ? "var(--fy-radius)" : THEME_RADIUS_VALUES[style.radius],
    "--fy-field-border-width": borderWidths[style.borderWidth],
  };
  return variables as CSSProperties;
}

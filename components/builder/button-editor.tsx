"use client";

import { ColorField } from "@/components/builder/color-field";
import { Segmented } from "@/components/builder/segmented";
import { inputClass, labelClass } from "@/components/ui";
import { CustomCssEditor } from "@/components/builder/custom-css-editor";
import {
  ACCENT_PRESETS,
  THEME_BUTTON_ALIGNMENTS,
  THEME_BUTTON_ALIGNMENT_LABELS,
  THEME_BUTTON_LABELS,
  THEME_BUTTON_SHAPES,
  THEME_BUTTON_SHAPE_LABELS,
  THEME_BUTTON_SIZE_LABELS,
  type FormDefinition,
  type FormTheme,
  type ThemeButtonAlignment,
  type ThemeButtonShape,
} from "@/lib/form-schema";

const BUTTON_COLOR_PRESETS = ACCENT_PRESETS.map((preset) => ({ label: preset.label, hex: preset.base }));
const TEXT_COLOR_PRESETS = [
  { label: "White", hex: "#ffffff" },
  { label: "Ink", hex: "#0f172a" },
  { label: "Charcoal", hex: "#334155" },
] as const;

type ButtonEditorProps = {
  form: FormDefinition;
  onLabelChange: (label: string) => void;
  onThemeChange: (patch: Partial<FormTheme>) => void;
  buttonCss: string;
  onButtonCssChange: (buttonCss: string) => void;
};

export function ButtonEditor({ form, onLabelChange, onThemeChange, buttonCss, onButtonCssChange }: ButtonEditorProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Submit button</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Choose how the button looks to people filling out this form.</p>
      </div>

      <div>
        <label htmlFor="button-label" className={labelClass}>Button text</label>
        <input id="button-label" className={inputClass} maxLength={60} value={form.submitLabel}
          onChange={(event) => onLabelChange(event.target.value)} />
      </div>

      <ColorField
        label="Button color"
        hint="Auto uses the form's accent color."
        autoHint="Use the accent color"
        value={form.theme.buttonColor}
        presets={BUTTON_COLOR_PRESETS}
        onChange={(buttonColor) => onThemeChange({ buttonColor })}
      />

      <ColorField
        label="Text color"
        hint="Auto chooses readable text for the button color."
        autoHint="Choose readable text automatically"
        value={form.theme.buttonTextColor}
        presets={TEXT_COLOR_PRESETS}
        onChange={(buttonTextColor) => onThemeChange({ buttonTextColor })}
      />

      <div>
        <span className={labelClass}>Width</span>
        <Segmented label="Button width" value={form.theme.button} options={THEME_BUTTON_LABELS}
          onChange={(button) => onThemeChange({ button })} />
        {form.theme.button === "custom" ? (
          <div className="mt-3">
            <label htmlFor="button-custom-width" className={labelClass}>Custom width</label>
            <input id="button-custom-width" className={inputClass} type="text" inputMode="text"
              value={form.theme.buttonWidthCustom} placeholder="240px or 80%" maxLength={8}
              pattern="[0-9]{1,4}(px|rem|em|%)"
              onChange={(event) => onThemeChange({ buttonWidthCustom: event.target.value })} />
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Use px, rem, em, or %.</p>
          </div>
        ) : null}
      </div>

      <div>
        <span className={labelClass}>Size</span>
        <Segmented label="Button size" value={form.theme.buttonSize} options={THEME_BUTTON_SIZE_LABELS}
          onChange={(buttonSize) => onThemeChange({ buttonSize })} />
        {form.theme.buttonSize === "custom" ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="text-xs font-medium text-slate-600">
              Text (px)
              <input className={`${inputClass} mt-1`} type="number" min={10} max={32} step={1}
                value={form.theme.buttonFontSizeCustom}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(value) && value >= 10 && value <= 32) onThemeChange({ buttonFontSizeCustom: value });
                }} />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Vertical
              <input className={`${inputClass} mt-1`} type="number" min={4} max={32} step={1}
                value={form.theme.buttonPaddingYCustom}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(value) && value >= 4 && value <= 32) onThemeChange({ buttonPaddingYCustom: value });
                }} />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Horizontal
              <input className={`${inputClass} mt-1`} type="number" min={8} max={48} step={1}
                value={form.theme.buttonPaddingXCustom}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(value) && value >= 8 && value <= 48) onThemeChange({ buttonPaddingXCustom: value });
                }} />
            </label>
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="button-shape" className={labelClass}>Corners</label>
        <select id="button-shape" className={inputClass} value={form.theme.buttonShape}
          onChange={(event) => onThemeChange({ buttonShape: event.target.value as ThemeButtonShape })}>
          {THEME_BUTTON_SHAPES.map((shape) => (
            <option key={shape} value={shape}>{THEME_BUTTON_SHAPE_LABELS[shape]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="button-align" className={labelClass}>Alignment</label>
        <select id="button-align" className={inputClass} value={form.theme.buttonAlign}
          onChange={(event) => onThemeChange({ buttonAlign: event.target.value as ThemeButtonAlignment })}>
          {THEME_BUTTON_ALIGNMENTS.map((alignment) => (
            <option key={alignment} value={alignment}>{THEME_BUTTON_ALIGNMENT_LABELS[alignment]}</option>
          ))}
        </select>
      </div>

      <CustomCssEditor
        id="submit-button-css"
        label="Custom CSS · Submit button"
        value={buttonCss}
        hint="These rules affect only the submit button. Use .fy-button."
        placeholder={".fy-button {\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n}"}
        onChange={onButtonCssChange}
      />
    </div>
  );
}

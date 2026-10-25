"use client";

import { hintClass, labelClass } from "@/components/ui";
import type { ThemeColorPreset } from "@/lib/form-schema";

type ColorFieldProps = {
  label: string;
  /** Helper text shown under the control. */
  hint?: string;
  autoHint?: string;
  /** Current value; "" means "Auto" (follow the appearance preset). */
  value: string;
  presets: readonly ThemeColorPreset[];
  onChange: (value: string) => void;
};

/**
 * Auto + preset swatches + custom color picker. Emits "" for Auto and a
 * 6-digit hex string otherwise.
 */
export function ColorField({ label, hint, autoHint = "Follow the appearance setting", value, presets, onChange }: ColorFieldProps) {
  const active = value.toLowerCase();

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          aria-pressed={value === ""}
          onClick={() => onChange("")}
          title={`Auto — ${autoHint.toLowerCase()}`}
          className={`flex h-8 items-center rounded-full border-2 px-3 text-xs font-semibold transition ${
            value === ""
              ? "border-slate-900 bg-white text-slate-900 ring-2 ring-slate-900/20"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          Auto
        </button>
        {presets.map((preset) => {
          const isActive = active === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              aria-label={`${label}: ${preset.label}`}
              aria-pressed={isActive}
              onClick={() => onChange(preset.hex)}
              className={`h-8 w-8 rounded-full border-2 transition ${
                isActive
                  ? "scale-110 border-slate-900 ring-2 ring-slate-900/20"
                  : "border-white shadow-sm hover:scale-105"
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          );
        })}
        <label
          title="Custom color"
          className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-300 shadow-sm transition hover:border-slate-400"
          style={{
            background: `linear-gradient(45deg, ${value || "#cbd5e1"} 50%, white 50%)`,
          }}
        >
          <span className="sr-only">Custom {label.toLowerCase()}</span>
          <input
            type="color"
            value={value || "#000000"}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
      {hint ? <p className={`${hintClass} mt-2`}>{hint}</p> : null}
    </div>
  );
}

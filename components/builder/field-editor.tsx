"use client";

import {
  CHOICE_TYPES,
  CARD_BG_PRESETS,
  FIELD_BORDER_WIDTH_LABELS,
  FIELD_COLOR_PRESETS,
  FIELD_SIZE_LABELS,
  FIELD_STYLE_DEFAULTS,
  FIELD_STYLE_RADIUS_LABELS,
  FIELD_TYPE_LABELS,
  MAX_OPTIONS,
  newId,
  type FormField,
  type FormOption,
  type FormFieldStyle,
} from "@/lib/form-schema";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { buttonGhost, buttonSecondary, inputClass, labelClass } from "@/components/ui";
import { ColorField } from "@/components/builder/color-field";
import { Segmented } from "@/components/builder/segmented";
import { CustomCssEditor } from "@/components/builder/custom-css-editor";

type FieldEditorProps = {
  field: FormField;
  fields: FormField[];
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
};

export function FieldEditor({ field, fields, onChange, onRemove }: FieldEditorProps) {
  const isChoice = (CHOICE_TYPES as readonly string[]).includes(field.type);
  const usesPlaceholder = field.type !== "radio" && field.type !== "checkbox" && field.type !== "date";
  const byId = new Map(fields.map((candidate) => [candidate.id, candidate]));
  const choiceSources = fields.filter((candidate) => {
    if (candidate.id === field.id || candidate.options.length === 0 ||
        !(CHOICE_TYPES as readonly string[]).includes(candidate.type)) return false;
    const visited = new Set<string>();
    let nextId: string | undefined = candidate.id;
    while (nextId && !visited.has(nextId)) {
      if (nextId === field.id) return false;
      visited.add(nextId);
      nextId = byId.get(nextId)?.showWhen?.sourceFieldId;
    }
    return true;
  });
  const conditionSource = choiceSources.find((candidate) => candidate.id === field.showWhen?.sourceFieldId);
  const style = field.style ?? FIELD_STYLE_DEFAULTS;

  function updateStyle(patch: Partial<FormFieldStyle>) {
    onChange({ style: { ...FIELD_STYLE_DEFAULTS, ...style, ...patch } });
  }

  function updateOption(optionId: string, label: string) {
    onChange({
      options: field.options.map((option) =>
        option.id === optionId ? { ...option, label } : option,
      ),
    });
  }

  function removeOption(optionId: string) {
    onChange({ options: field.options.filter((option) => option.id !== optionId) });
  }

  function addOption() {
    if (field.options.length >= MAX_OPTIONS) return;
    const option: FormOption = { id: newId("o"), label: `Option ${field.options.length + 1}` };
    onChange({ options: [...field.options, option] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Edit field</h2>
          <p className="text-xs text-slate-500">{FIELD_TYPE_LABELS[field.type]}</p>
        </div>
        <button type="button" onClick={onRemove} className={`${buttonGhost} text-red-500 hover:bg-red-50 hover:text-red-600`}>
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div>
        <label htmlFor="field-label" className={labelClass}>
          Label
        </label>
        <input
          id="field-label"
          value={field.label}
          maxLength={300}
          onChange={(event) => onChange({ label: event.target.value })}
          className={inputClass}
        />
      </div>

      {usesPlaceholder ? (
        <div>
          <label htmlFor="field-placeholder" className={labelClass}>
            {field.type === "dropdown" ? "Placeholder option text" : "Placeholder"}
          </label>
          <input
            id="field-placeholder"
            value={field.placeholder}
            maxLength={300}
            onChange={(event) => onChange({ placeholder: event.target.value })}
            className={inputClass}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="field-help" className={labelClass}>Help text</label>
        <input id="field-help" value={field.helpText} maxLength={500}
          onChange={(event) => onChange({ helpText: event.target.value })}
          className={inputClass} placeholder="Optional guidance shown below the field" />
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Field appearance</summary>
        <div className="mt-4 space-y-5">
          <ColorField label="Label color" value={style.labelColor} presets={FIELD_COLOR_PRESETS} onChange={(labelColor) => updateStyle({ labelColor })} />
          <ColorField label="Input background" value={style.inputBg} presets={CARD_BG_PRESETS} onChange={(inputBg) => updateStyle({ inputBg })} />
          <ColorField label="Input text" value={style.inputText} presets={FIELD_COLOR_PRESETS} onChange={(inputText) => updateStyle({ inputText })} />
          <ColorField label="Border color" value={style.inputBorder} presets={FIELD_COLOR_PRESETS} onChange={(inputBorder) => updateStyle({ inputBorder })} />
          <ColorField label="Focus and choices" value={style.accent} presets={FIELD_COLOR_PRESETS} onChange={(accent) => updateStyle({ accent })} />
          <div>
            <span className={labelClass}>Corners</span>
            <Segmented label="Field corner style" value={style.radius} options={FIELD_STYLE_RADIUS_LABELS} onChange={(radius) => updateStyle({ radius })} />
          </div>
          <div>
            <span className={labelClass}>Control size</span>
            <Segmented label="Field size" value={style.size} options={FIELD_SIZE_LABELS} onChange={(size) => updateStyle({ size })} />
          </div>
          <div>
            <span className={labelClass}>Border thickness</span>
            <Segmented label="Border thickness" value={style.borderWidth} options={FIELD_BORDER_WIDTH_LABELS} onChange={(borderWidth) => updateStyle({ borderWidth })} />
          </div>
          <button type="button" className={`${buttonGhost} -ml-2`} onClick={() => updateStyle(FIELD_STYLE_DEFAULTS)}>Reset field style</button>
        </div>
      </details>

      <CustomCssEditor
        id={`field-css-${field.id}`}
        label={`Custom CSS · ${FIELD_TYPE_LABELS[field.type]}`}
        value={field.customCss}
        hint="These rules affect only this field in the preview and live form. Use .fy-label, .fy-input, or .fy-choice."
        placeholder={".fy-label {\n  color: #1d4ed8;\n}\n\n.fy-input {\n  letter-spacing: 0.02em;\n}"}
        onChange={(customCss) => onChange({ customCss })}
      />

      {isChoice ? (
        <div>
          <span className={labelClass}>Options</span>
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  value={option.label}
                  maxLength={200}
                  aria-label={`Option ${index + 1} label`}
                  onChange={(event) => updateOption(option.id, event.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  aria-label={`Remove option ${index + 1}`}
                  className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {field.options.length === 0 ? (
            <p className="mt-2 text-xs text-red-600">Add at least one option.</p>
          ) : null}
          <button
            type="button"
            onClick={addOption}
            disabled={field.options.length >= MAX_OPTIONS}
            className={`${buttonSecondary} mt-3`}
          >
            <PlusIcon className="h-4 w-4" />
            Add option
          </button>
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(event) => onChange({ required: event.target.checked })}
          className="h-4 w-4 rounded accent-brand-600"
        />
        Required
      </label>

      <div className="border-t border-slate-200 pt-4">
        <label htmlFor="field-condition-source" className={labelClass}>Show this field when</label>
        <select
          id="field-condition-source"
          value={conditionSource?.id ?? ""}
          onChange={(event) => {
            const source = choiceSources.find((candidate) => candidate.id === event.target.value);
            onChange({ showWhen: source?.options[0]
              ? { sourceFieldId: source.id, optionId: source.options[0].id }
              : undefined });
          }}
          className={inputClass}
        >
          <option value="">Always show</option>
          {choiceSources.map((source) => (
            <option key={source.id} value={source.id}>{source.label || "Untitled choice"}</option>
          ))}
        </select>
        {conditionSource ? (
          <div className="mt-3">
            <label htmlFor="field-condition-option" className={labelClass}>
              Selected option
            </label>
            <select
              id="field-condition-option"
              value={field.showWhen?.optionId ?? ""}
              onChange={(event) => onChange({ showWhen: {
                sourceFieldId: conditionSource.id,
                optionId: event.target.value,
              } })}
              className={inputClass}
            >
              {conditionSource.options.map((option) => (
                <option key={option.id} value={option.id}>{option.label || "Untitled option"}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              For checkboxes, this means the option is checked. Hidden answers are not saved.
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">
            Add a dropdown, radio button, or checkbox field to show this field conditionally.
          </p>
        )}
      </div>
    </div>
  );
}

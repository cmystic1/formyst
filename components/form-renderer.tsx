"use client";

import type { FormEvent, ReactNode } from "react";
import { FIELD_STYLE_DEFAULTS, visibleFieldIds, type Answers, type FormDefinition, type FormField } from "@/lib/form-schema";
import { formFieldStyle, formThemeStyle } from "@/lib/form-theme";
import { safeCssText } from "@/lib/scoped-css";
import { SpinnerIcon } from "@/components/icons";

type FieldControlProps = {
  field: FormField;
  value: unknown;
  error?: string;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onChange: (fieldId: string, value: string | string[]) => void;
};

function FieldControl({ field, value, error, disabled, selected, onSelect, onChange }: FieldControlProps) {
  const errorId = `${field.id}-error`;
  const describedBy = error ? errorId : undefined;
  const commonProps = {
    id: field.id,
    name: field.id,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };
  const usesSingleControl = field.type !== "radio" && field.type !== "checkbox";
  const fieldStyle = field.style ?? FIELD_STYLE_DEFAULTS;
  const autoComplete =
    field.type === "email"
      ? "email"
      : field.type === "phone"
        ? "tel"
        : field.type === "textarea"
          ? undefined
          : "on";

  let control: ReactNode;
  const customCss = safeCssText(field.customCss.trim());
  const customCssScope = `fy-field-css-${field.id}`;

  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          {...commonProps}
          rows={4}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="fy-input"
        />
      );
      break;

    case "dropdown":
      control = (
        <select
          {...commonProps}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="fy-input"
        >
          <option value="">{field.placeholder || "Select an option"}</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;

    case "radio":
      control = (
        <div className="space-y-2.5" role="radiogroup" aria-describedby={describedBy}>
          {field.options.map((option) => (
            <label key={option.id} className="fy-choice-label">
              <input
                type="radio"
                name={field.id}
                value={option.id}
                checked={value === option.id}
                disabled={disabled}
                onChange={() => onChange(field.id, option.id)}
                className="fy-choice h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
      break;

    case "checkbox": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div className="space-y-2.5">
          {field.options.map((option) => (
            <label key={option.id} className="fy-choice-label">
              <input
                type="checkbox"
                value={option.id}
                checked={list.includes(option.id)}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    field.id,
                    event.target.checked
                      ? [...list, option.id]
                      : list.filter((id) => id !== option.id),
                  )
                }
                className="fy-choice h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
      break;
    }

    default:
      control = (
        <input
          {...commonProps}
          type={field.type === "phone" ? "tel" : field.type === "number" || field.type === "date" || field.type === "url" || field.type === "email" ? field.type : "text"}
          placeholder={field.placeholder}
          autoComplete={autoComplete}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="fy-input"
        />
      );
  }

  return (
    <div
      className={`fy-field fy-field-css-scope ${customCssScope}${selected || onSelect ? " fy-selectable" : ""}`}
      data-selected={selected ? "" : undefined}
      data-size={fieldStyle.size}
      style={formFieldStyle(fieldStyle)}
      onClick={onSelect}
    >
      {customCss ? <style>{`@scope (.${customCssScope}) {\n${customCss}\n}`}</style> : null}
      {usesSingleControl ? (
        <label htmlFor={field.id} className="fy-label">
          {field.label}
          {field.required ? (
            <span className="fy-required ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : (
        <span className="fy-label">
          {field.label}
          {field.required ? (
            <span className="fy-required ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      )}
      {control}
      {field.helpText ? <p className="mt-1 text-xs opacity-70">{field.helpText}</p> : null}
      {error ? (
        <p id={errorId} role="alert" className="fy-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type FormRendererProps = {
  form: FormDefinition;
  values: Answers;
  errors: Record<string, string>;
  disabled?: boolean;
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Builder canvas: the field currently selected for editing, if any. */
  selectedFieldId?: string | null;
  /** Builder canvas: whether the form header is selected for editing. */
  headerSelected?: boolean;
  buttonSelected?: boolean;
  onFieldSelect?: (fieldId: string) => void;
  onHeaderSelect?: () => void;
  onButtonSelect?: () => void;
  onChange: (fieldId: string, value: string | string[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * Renders the form fields and submit button. Shared by the live preview in the
 * builder and the public form page so both always look identical. The form's
 * theme is applied as CSS custom properties via .fy-theme / formThemeStyle().
 * The optional selection props power the builder's live canvas (click to edit)
 * and are unused by the preview and public form.
 */
export function FormRenderer({
  form,
  values,
  errors,
  disabled,
  submitting = false,
  submitDisabled = false,
  selectedFieldId,
  headerSelected = false,
  buttonSelected = false,
  onFieldSelect,
  onHeaderSelect,
  onButtonSelect,
  onChange,
  onSubmit,
}: FormRendererProps) {
  const alignClass = form.theme.align === "center" ? " fy-align-center" : "";
  const buttonIsWide = form.theme.button === "full" || form.theme.button === "custom";
  const buttonWidthClass = buttonIsWide ? " w-full" : "";
  const customWidth = /^\d{1,4}(?:px|rem|em|%)$/.test(form.theme.buttonWidthCustom)
    ? form.theme.buttonWidthCustom
    : "240px";
  const buttonWidthStyle = form.theme.button === "custom"
    ? { width: customWidth, maxWidth: "100%" }
    : undefined;
  const buttonAlignment = form.theme.buttonAlign === "auto" ? undefined : {
    justifyContent: form.theme.buttonAlign === "left" ? "flex-start"
      : form.theme.buttonAlign === "right" ? "flex-end" : "center",
  };
  const visible = visibleFieldIds(form, values);
  const headerCss = safeCssText(form.headerCss.trim());
  const buttonCss = safeCssText(form.buttonCss.trim());

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`fy-theme fy-form${alignClass} space-y-6`}
      style={formThemeStyle(form.theme)}
    >
      <div
        className={`fy-header fy-header-css-scope${onHeaderSelect ? " fy-selectable" : ""}`}
        data-selected={headerSelected ? "" : undefined}
        onClick={onHeaderSelect}
      >
        {headerCss ? <style>{`@scope (.fy-header-css-scope) {\n${headerCss}\n}`}</style> : null}
        {form.cover ? (
          <img src={form.cover} alt="" className="fy-cover mb-6" loading="lazy" />
        ) : null}
        {form.logo ? (
          <img src={form.logo} alt="" className="fy-logo mb-4" loading="lazy" />
        ) : null}
        {form.title ? <h1 className="fy-title">{form.title}</h1> : null}
        {form.description ? <p className="fy-description">{form.description}</p> : null}
      </div>

      {form.fields.filter((field) => visible.has(field.id)).map((field) => (
        <FieldControl
          key={field.id}
          field={field}
          value={values[field.id]}
          error={errors[field.id]}
          disabled={disabled}
          selected={selectedFieldId === field.id}
          onSelect={onFieldSelect ? () => onFieldSelect(field.id) : undefined}
          onChange={onChange}
        />
      ))}

      {errors._form ? (
        <p role="alert" className="fy-form-error">
          {errors._form}
        </p>
      ) : null}

      <div className="fy-actions" style={buttonAlignment}>
        <div
          className={`fy-button-css-scope${onButtonSelect ? " fy-button-selectable" : ""}${buttonWidthClass}`.trim()}
          style={buttonWidthStyle}
          data-selected={buttonSelected ? "" : undefined}
        >
          {buttonCss ? <style>{`@scope (.fy-button-css-scope) {\n${buttonCss}\n}`}</style> : null}
          <button
            type="submit"
            disabled={submitting || submitDisabled}
            className={`fy-button${buttonWidthClass}`}
            onClick={onButtonSelect ? (event) => {
              event.preventDefault();
              onButtonSelect();
            } : undefined}
          >
            {submitting ? <SpinnerIcon className="h-4 w-4" /> : null}
            {submitting ? "Submitting…" : form.submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { FormRenderer } from "@/components/form-renderer";
import { FormSuccess } from "@/components/form-success";
import { FormFrame } from "@/components/form-frame";
import {
  validateSubmission,
  type Answers,
  type FormDefinition,
} from "@/lib/form-schema";

function previewValues(form: FormDefinition): Answers {
  const values: Answers = {};
  for (const field of form.fields) {
    values[field.id] = field.type === "checkbox" ? [] : "";
  }
  return values;
}

function PreviewCanvas({ form }: { form: FormDefinition }) {
  const [values, setValues] = useState<Answers>(() => previewValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setValues(previewValues(form));
    setErrors({});
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateSubmission(form, values);
    if (!result.ok) {
      setErrors(result.errors);
      setSubmitted(false);
      return;
    }
    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <FormSuccess form={form} onReset={reset} />
        <p className="fy-notice mt-4">
          Preview mode — this is what respondents see after submitting. Nothing was recorded.
        </p>
      </div>
    );
  }

  return (
    <FormRenderer
      form={form}
      values={values}
      errors={errors}
      onChange={(fieldId, value) => setValues((previous) => ({ ...previous, [fieldId]: value }))}
      onSubmit={handleSubmit}
    />
  );
}

/**
 * Live preview of the form. Remounts only when fields are added/removed so
 * typed preview values survive label edits.
 */
export function PreviewPanel({ form }: { form: FormDefinition }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const signature = form.fields.map((field) => `${field.id}:${field.type}`).join("|");
  const mobile = device === "mobile";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Preview at common screen sizes</p>
        <div role="group" aria-label="Preview device size" className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button type="button" onClick={() => setDevice("desktop")} aria-pressed={!mobile}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${!mobile ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Desktop
          </button>
          <button type="button" onClick={() => setDevice("mobile")} aria-pressed={mobile}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mobile ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Mobile · 390px
          </button>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className={mobile
          ? "mx-auto w-[390px] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_36px_rgba(15,23,42,.16)] ring-1 ring-slate-300"
          : "w-full overflow-hidden rounded-xl bg-white shadow-[0_12px_36px_rgba(15,23,42,.10)] ring-1 ring-slate-200"}>
          <FormFrame form={form} className={mobile ? "min-h-[844px]" : "min-h-[720px]"}>
            <PreviewCanvas key={signature} form={form} />
          </FormFrame>
        </div>
      </div>
    </div>
  );
}

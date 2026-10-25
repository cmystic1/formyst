"use client";

import { useRef, useState, type FormEvent } from "react";
import { FormRenderer } from "@/components/form-renderer";
import { FormSuccess } from "@/components/form-success";
import { validateSubmission, type Answers, type FormDefinition } from "@/lib/form-schema";

function emptyValues(form: FormDefinition): Answers {
  const values: Answers = {};
  for (const field of form.fields) {
    values[field.id] = field.type === "checkbox" ? [] : "";
  }
  return values;
}

export function PublicForm({ form, formId }: { form: FormDefinition; formId: string }) {
  const [values, setValues] = useState<Answers>(() => emptyValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inFlight = useRef(false);

  function handleChange(fieldId: string, value: string | string[]) {
    setValues((previous) => ({ ...previous, [fieldId]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Guard against accidental double submits (double clicks / Enter mashing).
    if (inFlight.current) return;

    const clientCheck = validateSubmission(form, values);
    if (!clientCheck.ok) {
      setErrors(clientCheck.errors);
      return;
    }

    setErrors({});
    inFlight.current = true;
    setSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId, answers: clientCheck.answers }),
      });

      if (response.ok) {
        setSubmitted(true);
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { error?: string; errors?: Record<string, string> }
        | null;

      if (response.status === 400 && data?.errors) {
        setErrors(data.errors);
        return;
      }

      setErrors({
        _form:
          data?.error ??
          "Something went wrong and your response was not saved. Please try again.",
      });
    } catch {
      setErrors({
        _form: "Network error — your response was not saved. Please check your connection and try again.",
      });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <FormSuccess
        form={form}
        onReset={() => {
          setValues(emptyValues(form));
          setErrors({});
          setSubmitted(false);
        }}
      />
    );
  }

  return (
    <FormRenderer
      form={form}
      values={values}
      errors={errors}
      submitting={submitting}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

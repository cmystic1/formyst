"use client";

import { useState, type FormEvent } from "react";
import { FormRenderer } from "@/components/form-renderer";
import type { Answers, FormDefinition } from "@/lib/form-schema";

function canvasValues(form: FormDefinition): Answers {
  const values: Answers = {};
  for (const field of form.fields) {
    values[field.id] = field.type === "checkbox" ? [] : "";
  }
  return values;
}

type BuildCanvasProps = {
  form: FormDefinition;
  selectedFieldId: string | null;
  headerSelected: boolean;
  buttonSelected: boolean;
  onSelectField: (fieldId: string) => void;
  onSelectHeader: () => void;
  onSelectButton: () => void;
};

function Canvas({
  form,
  selectedFieldId,
  headerSelected,
  buttonSelected,
  onSelectField,
  onSelectHeader,
  onSelectButton,
}: BuildCanvasProps) {
  const [values, setValues] = useState<Answers>(() => canvasValues(form));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <FormRenderer
      form={form}
      values={values}
      errors={{}}
      selectedFieldId={selectedFieldId}
      headerSelected={headerSelected}
      buttonSelected={buttonSelected}
      onFieldSelect={onSelectField}
      onHeaderSelect={onSelectHeader}
      onButtonSelect={onSelectButton}
      onChange={(fieldId, value) => setValues((previous) => ({ ...previous, [fieldId]: value }))}
      onSubmit={handleSubmit}
    />
  );
}

/**
 * The interactive form shown in the builder's Build view: pixel-identical to
 * the preview, but clicking the header or a field selects it for editing.
 * Remounts only when fields are added/removed so typed values survive edits.
 */
export function BuildCanvas(props: BuildCanvasProps) {
  const signature = props.form.fields.map((field) => `${field.id}:${field.type}`).join("|");
  return <Canvas key={signature} {...props} />;
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FIELD_TYPE_LABELS, type FormField } from "@/lib/form-schema";
import { GripIcon, TrashIcon } from "@/components/icons";

type FieldRowProps = {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

export function FieldRow({ field, selected, onSelect, onRemove }: FieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border bg-white p-2 pl-1 transition ${
        selected
          ? "border-brand-400 ring-2 ring-brand-500/10"
          : "border-slate-200 hover:border-slate-300"
      } ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${field.label || "field"}`}
        className="cursor-grab touch-none rounded-md p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
      >
        <GripIcon className="h-4 w-4" />
      </button>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-slate-800">
          {field.label || "Untitled field"}
        </span>
        <span className="block text-xs text-slate-400">
          {FIELD_TYPE_LABELS[field.type]}
          {field.required ? " · Required" : ""}
        </span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete ${field.label || "field"}`}
        className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

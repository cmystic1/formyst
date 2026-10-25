"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { IMAGE_MIME_TYPES, MAX_IMAGE_FILE_BYTES } from "@/lib/form-schema";
import { PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { buttonGhost, buttonSecondary, hintClass, inputClass, labelClass } from "@/components/ui";

type BrandingFieldProps = {
  label: string;
  /** Helper text shown under the control. */
  hint: string;
  /** Current value: "" (none), https URL, or data:image/… upload. */
  value: string;
  /** Preview thumbnail shape. */
  shape: "square" | "wide";
  onChange: (value: string) => void;
};

const ACCEPT = IMAGE_MIME_TYPES.join(",");

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/.test(value);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Add / replace / remove one branding image (logo or cover): file upload,
 * pasted URL, or clear. Emits "" when removed.
 */
export function BrandingField({ label, hint, value, shape, onChange }: BrandingFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => (isHttpUrl(value) ? value : ""));
  const isUpload = value.startsWith("data:image/");

  async function handleFile(file: File) {
    setError(null);
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Use a PNG, JPEG, WebP, GIF or SVG image.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setError(`Image must be smaller than ${Math.round(MAX_IMAGE_FILE_BYTES / 1024)} KB.`);
      return;
    }
    try {
      onChange(await readFileAsDataUrl(file));
      setDraft("");
    } catch {
      setError("Could not read that file. Try another image.");
    }
  }

  function applyDraft() {
    const url = draft.trim();
    if (!isHttpUrl(url)) {
      setError("Enter a full image URL starting with http:// or https://");
      return;
    }
    setError(null);
    onChange(url);
  }

  function remove() {
    setError(null);
    onChange("");
    setDraft("");
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = ""; // allow re-selecting the same file
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={labelClass}>{label}</span>
        {value ? (
          <button
            type="button"
            onClick={remove}
            className={`${buttonGhost} text-red-500 hover:bg-red-50 hover:text-red-600`}
          >
            <TrashIcon className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <img
            src={value}
            alt=""
            className={`shrink-0 bg-white ring-1 ring-slate-200 ${
              shape === "wide" ? "h-12 w-24 rounded-lg object-cover" : "h-12 w-12 rounded-lg object-contain"
            }`}
          />
          <p className="min-w-0 flex-1 truncate text-xs text-slate-500">
            {isUpload ? "Uploaded image" : value}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${buttonSecondary} shrink-0 py-1.5 text-xs`}
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add {label.toLowerCase()}
        </button>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyDraft();
            }
          }}
          placeholder="…or paste an image URL"
          aria-label={`${label} image URL`}
          className={`${inputClass} py-2 text-xs`}
        />
        <button
          type="button"
          onClick={applyDraft}
          disabled={!draft.trim()}
          className={`${buttonSecondary} shrink-0 py-2 text-xs`}
        >
          Use URL
        </button>
      </div>

      <p className={`${hintClass} mt-1.5`}>{hint}</p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}

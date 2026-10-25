"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ACCENT_PRESETS,
  CARD_BG_PRESETS,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  PAGE_BG_PRESETS,
  THEME_ALIGNMENT_LABELS,
  THEME_CARD_MATERIAL_LABELS,
  THEME_FONT_LABELS,
  THEME_RADIUS_LABELS,
  THEME_SURFACE_LABELS,
  createField,
  type FieldType,
  type FormDefinition,
  type FormField,
  type FormTheme,
} from "@/lib/form-schema";
import { FormFrame } from "@/components/form-frame";
import { BrandingField } from "@/components/builder/branding-field";
import { ButtonEditor } from "@/components/builder/button-editor";
import { BuildCanvas } from "@/components/builder/build-canvas";
import { ColorField } from "@/components/builder/color-field";
import { CustomCssEditor } from "@/components/builder/custom-css-editor";
import { FieldEditor } from "@/components/builder/field-editor";
import { FieldRow } from "@/components/builder/field-row";
import { PreviewPanel } from "@/components/builder/preview";
import { AIChatLauncher, AIFormAssistant } from "@/components/builder/ai-form-assistant";
import { Segmented } from "@/components/builder/segmented";
import { EyeIcon, ExternalLinkIcon, LogoMark, PencilIcon, PlusIcon, SpinnerIcon } from "@/components/icons";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  cardClass,
  hintClass,
  inputClass,
  labelClass,
  sectionTitleClass,
} from "@/components/ui";

const FIELD_TYPE_MARKS: Record<FieldType, string> = {
  text: "Aa",
  email: "@",
  phone: "☎",
  number: "#",
  date: "31",
  url: "↗",
  dropdown: "☷",
  radio: "◉",
  checkbox: "☑",
  textarea: "¶",
};

const FIELD_TYPE_HINTS: Record<FieldType, string> = {
  text: "Short answer",
  email: "Email address",
  phone: "Phone number",
  number: "Numeric answer",
  date: "Pick a date",
  url: "Website address",
  dropdown: "Choose one",
  radio: "Single choice",
  checkbox: "Select many",
  textarea: "Long answer",
};

type BuilderProps = {
  formId: string;
  initialForm: FormDefinition;
  isPublished: boolean;
  canManageUsers: boolean;
};

function SaveStatus({
  dirty,
  saving,
  savedAt,
}: {
  dirty: boolean;
  saving: boolean;
  savedAt: Date | null;
}) {
  if (saving) {
    return (
      <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:inline-flex">
        <SpinnerIcon className="h-3.5 w-3.5" /> Saving…
      </span>
    );
  }
  if (dirty) {
    return <span className="hidden text-xs font-medium text-amber-600 sm:inline">Unsaved changes</span>;
  }
  if (savedAt) {
    return (
      <span className="hidden text-xs font-medium text-emerald-600 sm:inline">
        Saved {savedAt.toLocaleTimeString()}
      </span>
    );
  }
  return null;
}

export function Builder({ formId, initialForm, isPublished, canManageUsers }: BuilderProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition>(initialForm);
  const [published, setPublished] = useState(isPublished);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<"header" | "button" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removedField, setRemovedField] = useState<{ form: FormDefinition; label: string; id: string } | null>(null);
  const [view, setView] = useState<"build" | "preview">("build");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  const formRef = useRef(form);
  const savingRef = useRef(false);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // dnd-kit derives the aria-describedby id from a module-level counter that
  // keeps incrementing across server requests but resets in the browser, which
  // breaks hydration. Passing an explicit id (useId is SSR-stable) makes it
  // deterministic on both sides.
  const dndDescribedById = useId();

  const selectedField = form.fields.find((field) => field.id === selectedId) ?? null;

  function updateForm(updater: (previous: FormDefinition) => FormDefinition) {
    setForm((previous) => updater(previous));
    setDirty(true);
    setSaveError(null);
    setRemovedField(null);
  }

  function updateField(fieldId: string, patch: Partial<FormField>) {
    updateForm((previous) => ({
      ...previous,
      fields: previous.fields.map((field) => {
        if (field.id === fieldId) return { ...field, ...patch };
        if (patch.options && field.showWhen?.sourceFieldId === fieldId &&
            !patch.options.some((option) => option.id === field.showWhen?.optionId)) {
          return { ...field, showWhen: undefined };
        }
        return field;
      }),
    }));
  }

  function updateTheme(patch: Partial<FormTheme>) {
    updateForm((previous) => ({ ...previous, theme: { ...previous.theme, ...patch } }));
  }

  function addField(type: FieldType) {
    const field = createField(type);
    updateForm((previous) => ({ ...previous, fields: [...previous.fields, field] }));
    setSelectedId(field.id);
    setSelectedPart(null);
    setView("build");
  }

  function removeField(fieldId: string) {
    const field = form.fields.find((item) => item.id === fieldId);
    if (!field) return;
    const previousForm = form;
    updateForm((previous) => ({
      ...previous,
      fields: previous.fields
        .filter((item) => item.id !== fieldId)
        .map((item) => item.showWhen?.sourceFieldId === fieldId
          ? { ...item, showWhen: undefined }
          : item),
    }));
    setRemovedField({ form: previousForm, label: field.label || "Field", id: fieldId });
    if (selectedId === fieldId) {
      setSelectedId(null);
      setSelectedPart(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateForm((previous) => {
      const oldIndex = previous.fields.findIndex((field) => field.id === active.id);
      const newIndex = previous.fields.findIndex((field) => field.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return previous;
      return { ...previous, fields: arrayMove(previous.fields, oldIndex, newIndex) };
    });
  }

  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/form", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId, form: formRef.current }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return false;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string; errors?: Record<string, string> }
          | null;
        const detail = data?.errors?._form ?? data?.error ?? `Save failed (${response.status}).`;
        throw new Error(detail);
      }

      setDirty(false);
      setRemovedField(null);
      if (formRef.current.fields.length === 0) setPublished(false);
      setSavedAt(new Date());
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed. Please try again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [router, formId]);

  const updateVisibility = useCallback(async (nextPublished: boolean) => {
    if (visibilityBusy || savingRef.current) return;
    if (nextPublished && formRef.current.fields.length === 0) {
      setSaveError("Add at least one field before publishing.");
      return;
    }
    setVisibilityBusy(true);
    setSaveError(null);
    try {
      if (dirty && !(await save())) return;
      const response = await fetch("/api/forms", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId, published: nextPublished }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Could not update publishing status.");
      setPublished(nextPublished);
      setSavedAt(new Date());
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not update publishing status.");
    } finally {
      setVisibilityBusy(false);
    }
  }, [visibilityBusy, dirty, save, formId, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex w-full flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <Link href="/forms" className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-bold text-slate-900">Formyst</span>
          </Link>
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Forms / Builder</p>
            <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{form.title || "Untitled form"}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SaveStatus dirty={dirty} saving={saving} savedAt={savedAt} />
            {canManageUsers ? (
              <Link href="/accounts" className={`${buttonGhost} hidden sm:inline-flex`}>Accounts</Link>
            ) : null}
            <div
              role="group"
              aria-label="Builder view"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => setView("build")}
                aria-pressed={view === "build"}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  view === "build"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Build
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("preview");
                  setSelectedId(null);
                  setSelectedPart(null);
                }}
                aria-pressed={view === "preview"}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  view === "preview"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <EyeIcon className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
            {published ? (
              <Link
                href={`/f/${formId}`}
                target="_blank"
                className={`${buttonSecondary} hidden sm:inline-flex`}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                Open form
              </Link>
            ) : (
              <span className="hidden text-xs text-slate-500 sm:inline">Live link available after publishing</span>
            )}
            <Link href={`/forms/${formId}/submissions`} className={`${buttonSecondary} hidden xl:inline-flex`}>
              Responses
            </Link>
            <button type="button" onClick={() => void updateVisibility(!published)} disabled={visibilityBusy || saving || (!published && form.fields.length === 0)} className={published ? buttonSecondary : buttonPrimary} title={!published && form.fields.length === 0 ? "Add at least one field before publishing." : undefined}>
              {visibilityBusy ? <SpinnerIcon className="h-4 w-4" /> : null}
              {visibilityBusy ? "Updating…" : published ? "Unpublish" : "Publish"}
            </button>
            <button type="button" onClick={() => void save()} disabled={saving || visibilityBusy || !dirty} className={published ? buttonPrimary : buttonSecondary}>
              {saving ? <SpinnerIcon className="h-4 w-4" /> : null}
              {saving ? "Saving…" : dirty ? published ? "Save changes" : "Save draft" : published ? "Saved" : "Draft saved"}
            </button>
          </div>
        </div>
        {saveError ? (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
            {saveError}
          </div>
        ) : null}
        {removedField ? (
          <div role="status" className="flex items-center justify-center gap-3 border-t border-brand-100 bg-brand-50 px-4 py-2 text-sm text-brand-900">
            <span>“{removedField.label}” removed from this draft.</span>
            <button type="button" className="font-bold underline underline-offset-2 hover:text-brand-600"
              onClick={() => {
                updateForm(() => removedField.form);
                setSelectedId(removedField.id);
                setSelectedPart(null);
              }}>
              Undo
            </button>
          </div>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <aside
          aria-label="Form settings"
          className={`w-full shrink-0 space-y-5 border-b border-slate-200 bg-[#fbfcff] p-4 lg:h-full lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-16 xl:w-[320px] ${
            view === "build" ? "" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand-600">Create</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Form settings</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{form.fields.length} fields</span>
          </div>
          <section className={cardClass}>
            <h2 className={sectionTitleClass}>Design</h2>
            <div className="mt-4 space-y-5">
              <div>
                <span className={labelClass}>Accent color</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {ACCENT_PRESETS.map((preset) => {
                    const active = form.theme.accent.toLowerCase() === preset.base;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        aria-label={preset.label}
                        aria-pressed={active}
                        onClick={() => updateTheme({ accent: preset.base })}
                        className={`h-8 w-8 rounded-full border-2 transition ${
                          active
                            ? "scale-110 border-slate-900 ring-2 ring-slate-900/20"
                            : "border-white shadow-sm hover:scale-105"
                        }`}
                        style={{ backgroundColor: preset.base }}
                      />
                    );
                  })}
                  <label
                    title="Custom color"
                    className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-300 shadow-sm transition hover:border-slate-400"
                    style={{
                      background: `linear-gradient(45deg, ${form.theme.accent} 50%, white 50%)`,
                    }}
                  >
                    <span className="sr-only">Custom accent color</span>
                    <input
                      type="color"
                      value={form.theme.accent}
                      onChange={(event) => updateTheme({ accent: event.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                <p className={`${hintClass} mt-2`}>Pick a swatch or choose any custom color.</p>
              </div>

              <div>
                <span className={labelClass}>Appearance</span>
                <Segmented
                  label="Appearance"
                  value={form.theme.surface}
                  options={THEME_SURFACE_LABELS}
                  onChange={(surface) => updateTheme({ surface })}
                />
              </div>

              <ColorField
                label="Page background"
                hint="Background behind the form card. Auto follows the appearance setting."
                value={form.theme.pageBg}
                presets={PAGE_BG_PRESETS}
                onChange={(pageBg) => updateTheme({ pageBg })}
              />

              <BrandingField
                label="Page background image"
                hint="Optional image behind the card. The page background color shows underneath it."
                value={form.background}
                shape="wide"
                onChange={(background) => updateForm((previous) => ({ ...previous, background }))}
              />

              <CustomCssEditor
                id="page-background-css"
                label="Custom CSS · Page background"
                value={form.backgroundCss}
                hint="These rules are scoped to the form page. Use :scope to style the page itself."
                placeholder={":scope {\n  background-image: linear-gradient(135deg, #eef2ff, #fdf2f8);\n}"}
                onChange={(backgroundCss) => updateForm((previous) => ({ ...previous, backgroundCss }))}
              />

              <ColorField
                label="Card background"
                hint="The form card surface. Text colors adjust automatically for contrast."
                value={form.theme.cardBg}
                presets={CARD_BG_PRESETS}
                onChange={(cardBg) => updateTheme({ cardBg })}
              />

              <div>
                <span className={labelClass}>Card material</span>
                <Segmented
                  label="Card material"
                  value={form.theme.cardMaterial}
                  options={THEME_CARD_MATERIAL_LABELS}
                  onChange={(cardMaterial) => updateTheme({ cardMaterial })}
                />
                <p className={hintClass}>Glass uses a translucent card with a soft backdrop blur.</p>
              </div>

              <div>
                <span className={labelClass}>Corners</span>
                <Segmented
                  label="Corner style"
                  value={form.theme.radius}
                  options={THEME_RADIUS_LABELS}
                  onChange={(radius) => updateTheme({ radius })}
                />
              </div>

              <div>
                <span className={labelClass}>Font</span>
                <Segmented
                  label="Font"
                  value={form.theme.font}
                  options={THEME_FONT_LABELS}
                  onChange={(font) => updateTheme({ font })}
                />
              </div>

              <div>
                <label htmlFor="custom-font" className={labelClass}>
                  Custom font family
                </label>
                <input
                  id="custom-font"
                  value={form.theme.fontCustom}
                  maxLength={300}
                  placeholder='e.g. "Poppins", ui-sans-serif, sans-serif'
                  onChange={(event) => updateTheme({ fontCustom: event.target.value })}
                  className={inputClass}
                />
                <p className={`${hintClass} mt-1.5`}>
                  Optional CSS font-family stack. Overrides the font choice above when set.
                </p>
              </div>

              <CustomCssEditor
                id="form-custom-css"
                label="Custom CSS · Entire form"
                value={form.customCss}
                maxLength={12_000}
                hint="These rules affect the whole form. Use .fy-page, .fy-card, .fy-field, .fy-title, or .fy-button."
                placeholder={".fy-card {\n  border-radius: 28px;\n}\n\n.fy-input {\n  letter-spacing: 0.02em;\n}"}
                onChange={(customCss) => updateForm((previous) => ({ ...previous, customCss }))}
              />

              <div>
                <span className={labelClass}>Alignment</span>
                <Segmented
                  label="Form alignment"
                  value={form.theme.align}
                  options={THEME_ALIGNMENT_LABELS}
                  onChange={(align) => updateTheme({ align })}
                />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={sectionTitleClass}>Submit button</h2>
            <p className={`${hintClass} mt-1 leading-5`}>Change its text, colors, size, width, corners, and position.</p>
            <button type="button" className={`${buttonSecondary} mt-4 w-full`}
              onClick={() => {
                setSelectedId(null);
                setSelectedPart("button");
              }}>
              Customize button
            </button>
          </section>

          <section className={cardClass}>
            <h2 className={sectionTitleClass}>Branding</h2>
            <div className="mt-4 space-y-6">
              <BrandingField
                label="Logo"
                hint="Shown above the form title. A square PNG or SVG works best."
                value={form.logo}
                shape="square"
                onChange={(logo) => updateForm((previous) => ({ ...previous, logo }))}
              />
              <BrandingField
                label="Cover"
                hint="Banner image at the top of the form."
                value={form.cover}
                shape="wide"
                onChange={(cover) => updateForm((previous) => ({ ...previous, cover }))}
              />
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.poweredBy}
                  onChange={(event) =>
                    updateForm((previous) => ({ ...previous, poweredBy: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Show “Powered by Formyst” under the form
                </span>
              </label>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={sectionTitleClass}>After submission</h2>
            <p className={`${hintClass} mt-1`}>
              What respondents see after a successful submit. Test it in Preview.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="success-title" className={labelClass}>
                  Thank-you title
                </label>
                <input
                  id="success-title"
                  value={form.successTitle}
                  maxLength={200}
                  placeholder="Thank you!"
                  onChange={(event) =>
                    updateForm((previous) => ({ ...previous, successTitle: event.target.value }))
                  }
                  className={inputClass}
                />
                <p className={`${hintClass} mt-1.5`}>Leave empty to hide the heading.</p>
              </div>
              <div>
                <label htmlFor="success-message" className={labelClass}>
                  Thank-you message
                </label>
                <textarea
                  id="success-message"
                  rows={3}
                  maxLength={1000}
                  value={form.successMessage}
                  onChange={(event) =>
                    updateForm((previous) => ({ ...previous, successMessage: event.target.value }))
                  }
                  className={`${inputClass} resize-y`}
                />
                <p className={`${hintClass} mt-1.5`}>Leave empty to hide the message.</p>
              </div>
              <div>
                <label htmlFor="success-button" className={labelClass}>
                  “Submit another” button text
                </label>
                <input
                  id="success-button"
                  value={form.successButton}
                  maxLength={60}
                  onChange={(event) =>
                    updateForm((previous) => ({ ...previous, successButton: event.target.value }))
                  }
                  className={inputClass}
                />
                <p className={`${hintClass} mt-1.5`}>Leave empty to hide the button.</p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={sectionTitleClass}>Add field</h2>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700">10 types</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Choose a field to add.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="group flex min-h-[88px] flex-col items-stretch rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={`Add ${FIELD_TYPE_LABELS[type]} field`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
                      {FIELD_TYPE_MARKS[type]}
                    </span>
                    <PlusIcon className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-brand-600" />
                  </span>
                  <span className="mt-1.5 block w-full break-words text-xs font-semibold leading-4 text-slate-800 group-hover:text-brand-800">
                    {FIELD_TYPE_LABELS[type]}
                  </span>
                  <span className="mt-0.5 block w-full text-[10px] leading-3.5 text-slate-500">
                    {FIELD_TYPE_HINTS[type]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleClass}>Fields ({form.fields.length})</h2>
              {form.fields.length > 1 ? (
                <span className="text-xs text-slate-400">Drag to reorder</span>
              ) : null}
            </div>

            {form.fields.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400">
                No fields yet — add one above.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <DndContext
                  id={dndDescribedById}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={form.fields.map((field) => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {form.fields.map((field) => (
                      <FieldRow
                        key={field.id}
                        field={field}
                        selected={field.id === selectedId}
                        onSelect={() => {
                          setSelectedId(field.id);
                          setSelectedPart(null);
                          setView("build");
                        }}
                        onRemove={() => removeField(field.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </section>
        </aside>

        <section
          aria-label="Form canvas"
          className="builder-workspace flex-1 lg:min-h-0 lg:overflow-y-auto"
        >
          {view === "build" ? (
            <div className="min-h-full p-4 sm:p-6" onClick={(event) => {
              if (event.target instanceof Element &&
                  !event.target.closest(".fy-selectable, .fy-button-selectable")) {
                setSelectedId(null);
                setSelectedPart(null);
              }
            }}>
              <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between gap-3 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[.12em] text-slate-600">Live canvas</span>
                <span>Click a field to edit it</span>
              </div>
              <div className="mx-auto max-w-2xl overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,.08)]">
                <FormFrame form={form} className="min-h-[560px]">
                  <BuildCanvas
                    form={form}
                    selectedFieldId={selectedId}
                    headerSelected={selectedPart === "header"}
                    buttonSelected={selectedPart === "button"}
                    onSelectField={(fieldId) => {
                      setSelectedId(fieldId);
                      setSelectedPart(null);
                    }}
                    onSelectHeader={() => {
                      setSelectedId(null);
                      setSelectedPart("header");
                    }}
                    onSelectButton={() => {
                      setSelectedId(null);
                      setSelectedPart("button");
                    }}
                  />
                </FormFrame>
              </div>
            </div>
          ) : (
            <div className="min-h-full p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className={sectionTitleClass}>Preview</h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                    Preview only · not recorded
                  </span>
                  {published && dirty ? (
                    <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:inline-flex">
                      Save changes to update the live form
                    </span>
                  ) : null}
                  {published ? (
                    <Link href={`/f/${formId}`} target="_blank" className={`${buttonSecondary} py-1.5 text-xs`}>
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      Open live form
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">The live link opens after you publish.</span>
                  )}
                </div>
              </div>
              <PreviewPanel form={form} />
            </div>
          )}
        </section>

        <aside
          aria-label="Editor"
          className={`w-full shrink-0 space-y-5 border-t border-slate-200 bg-[#fbfcff] p-4 lg:h-full lg:w-[300px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pb-16 xl:w-[330px] ${
            view === "build" ? "" : "hidden"
          }`}
        >
          {selectedField ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedPart(null);
                }}
                className={`${buttonGhost} -ml-2`}
              >
                ← Form settings
              </button>
              <section className={cardClass}>
                <FieldEditor
                  field={selectedField}
                  fields={form.fields}
                  onChange={(patch) => updateField(selectedField.id, patch)}
                  onRemove={() => removeField(selectedField.id)}
                />
              </section>
            </>
          ) : selectedPart === "button" ? (
            <>
              <button type="button" onClick={() => setSelectedPart(null)} className={`${buttonGhost} -ml-2`}>
                ← Form settings
              </button>
              <section className={cardClass}>
                <ButtonEditor
                  form={form}
                  onLabelChange={(submitLabel) => updateForm((previous) => ({ ...previous, submitLabel }))}
                  onThemeChange={updateTheme}
                  buttonCss={form.buttonCss}
                  onButtonCssChange={(buttonCss) => updateForm((previous) => ({ ...previous, buttonCss }))}
                />
              </section>
            </>
          ) : (
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Form</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="form-title" className={labelClass}>
                    Title
                  </label>
                  <input
                    id="form-title"
                    value={form.title}
                    maxLength={200}
                    onChange={(event) => updateForm((previous) => ({ ...previous, title: event.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="form-description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="form-description"
                    rows={3}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateForm((previous) => ({ ...previous, description: event.target.value }))
                    }
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <CustomCssEditor
                  id="form-header-css"
                  label="Custom CSS · Form header"
                  value={form.headerCss}
                  hint="These rules affect the title and description area. Use .fy-title or .fy-description."
                  placeholder={".fy-title {\n  letter-spacing: 0.04em;\n}\n\n.fy-description {\n  font-size: 1rem;\n}"}
                  onChange={(headerCss) => updateForm((previous) => ({ ...previous, headerCss }))}
                />
              </div>
            </section>
          )}
        </aside>
      </main>
      {!assistantOpen ? <AIChatLauncher onClick={() => setAssistantOpen(true)} /> : null}
      {assistantOpen ? (
        <AIFormAssistant
          formId={formId}
          form={form}
          onApply={(nextForm) => {
            updateForm(() => nextForm);
            setSelectedId(null);
            setSelectedPart(null);
          }}
          onClose={() => setAssistantOpen(false)}
        />
      ) : null}
    </div>
  );
}

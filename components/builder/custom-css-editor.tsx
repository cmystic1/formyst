"use client";

type CustomCssEditorProps = {
  id: string;
  label: string;
  value: string;
  hint: string;
  placeholder: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

export function CustomCssEditor({
  id,
  label,
  value,
  hint,
  placeholder,
  maxLength = 5_000,
  onChange,
}: CustomCssEditorProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
        <span>{label}</span>
      </summary>
      <div className="mt-3">
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2">
            <label htmlFor={id} className="font-mono text-[11px] font-semibold tracking-wide text-slate-300">CSS</label>
            <span className="font-mono text-[10px] text-slate-500">{value ? "Applied to preview" : "Ready"}</span>
          </div>
          <textarea
            id={id}
            value={value}
            maxLength={maxLength}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => onChange(event.target.value)}
            className="block min-h-36 w-full resize-y border-0 bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 caret-emerald-300 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-brand-400"
            placeholder={placeholder}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">{hint} Updates instantly in the builder; save the form to update its live link.</p>
        <p className="mt-1 text-right text-xs text-slate-400">
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      </div>
    </details>
  );
}

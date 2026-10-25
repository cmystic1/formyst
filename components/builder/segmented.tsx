"use client";

type SegmentedProps<T extends string> = {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  label: string;
};

/**
 * Compact segmented radiogroup used by the builder's Design panel.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fit,minmax(4.25rem,1fr))] gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
    >
      {(Object.keys(options) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`min-w-0 rounded-md px-2 py-1.5 text-center text-xs leading-tight font-medium whitespace-normal transition ${
            value === key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {options[key]}
        </button>
      ))}
    </div>
  );
}

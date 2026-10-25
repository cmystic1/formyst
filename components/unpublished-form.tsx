type UnpublishedFormProps = {
  /** Class for the outer <main>; lets the builder preview size it to fit. */
  className?: string;
};

/**
 * What visitors see when a form has no fields yet. Shared by the
 * public page and the builder preview so the preview always matches live.
 */
export function UnpublishedForm({
  className = "flex min-h-screen items-center justify-center px-4 py-12",
}: UnpublishedFormProps) {
  return (
    <main className={className}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">This form is not published yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to the admin area and save your form to make it live at this address.
        </p>
        <a
          href="/login"
          className="mt-5 inline-flex text-sm font-medium text-brand-600 hover:text-brand-500"
        >
          Go to admin login →
        </a>
      </div>
    </main>
  );
}

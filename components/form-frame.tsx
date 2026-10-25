import type { ReactNode } from "react";
import type { FormDefinition } from "@/lib/form-schema";
import { formThemeStyle } from "@/lib/form-theme";
import { safeCssText } from "@/lib/scoped-css";

type FormFrameProps = {
  form: FormDefinition;
  children: ReactNode;
  /**
   * Renders a full-viewport-height <main> landmark. Used by public form pages
   * page; the builder preview uses the same frame without it.
   */
  fullPage?: boolean;
  /** Extra classes for the page element (e.g. a min-height in the preview). */
  className?: string;
};

/**
 * The themed page frame around the form (page background, centered card,
 * "Powered by" line). Shared by the public form and the builder preview so
 * the two are guaranteed to render identically.
 */
export function FormFrame({ form, children, fullPage = false, className }: FormFrameProps) {
  const style = {
    ...formThemeStyle(form.theme),
    "--fy-page-image": form.background ? `url(${JSON.stringify(form.background)})` : "none",
  };
  const classes = [
    "fy-page flex justify-center px-4 py-10 sm:py-16",
    fullPage ? "min-h-screen" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // Custom CSS is kept inside the form's CSS scope so it doesn't restyle the
  // builder controls around the live preview. Escape a possible HTML style
  // closing sequence before placing owner-authored CSS in a style element.
  const customCss = safeCssText(form.customCss.trim());
  const customStyles = customCss ? (
    <style>{`@scope (.fy-custom-css-scope) {\n${customCss}\n}`}</style>
  ) : null;
  const backgroundCss = safeCssText(form.backgroundCss.trim());
  const backgroundStyles = backgroundCss ? (
    <style>{`@scope (.fy-background-css-scope) {\n${backgroundCss}\n}`}</style>
  ) : null;

  const content = (
    <div className="w-full max-w-2xl">
      <div className="fy-card p-6 shadow-sm sm:p-10">{children}</div>
      {form.poweredBy ? (
        <p className="fy-muted mt-4 text-center text-xs opacity-70">Powered by Formyst</p>
      ) : null}
    </div>
  );

  if (fullPage) {
    return (
      <main className={`${classes} fy-custom-css-scope fy-background-css-scope`} style={style}>
        {customStyles}
        {backgroundStyles}
        {content}
      </main>
    );
  }
  return (
    <div className={`${classes} fy-custom-css-scope fy-background-css-scope`} style={style}>
      {customStyles}
      {backgroundStyles}
      {content}
    </div>
  );
}

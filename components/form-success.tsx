"use client";

import type { FormDefinition } from "@/lib/form-schema";
import { formThemeStyle } from "@/lib/form-theme";
import { CheckIcon } from "@/components/icons";
import { buttonSecondary } from "@/components/ui";

type FormSuccessProps = {
  form: FormDefinition;
  /** Resets back to the form. Omit to hide the "submit another" button. */
  onReset?: () => void;
};

/**
 * The post-submission thank-you screen. Shared by the public form and the
 * builder preview so both render identical, fully themed success state with
 * the customizable title/message/button.
 */
export function FormSuccess({ form, onReset }: FormSuccessProps) {
  const alignClass = form.theme.align === "center" ? " fy-align-center" : "";
  const showReset = Boolean(form.successButton) && Boolean(onReset);

  return (
    <div
      className={`fy-theme fy-form py-6 text-center${alignClass}`}
      style={formThemeStyle(form.theme)}
    >
      <span className="fy-accent-soft mx-auto flex h-14 w-14 items-center justify-center rounded-full">
        <CheckIcon className="h-7 w-7" />
      </span>
      {form.successTitle ? <h1 className="fy-title mt-5">{form.successTitle}</h1> : null}
      {form.successMessage ? <p className="fy-description">{form.successMessage}</p> : null}
      {showReset ? (
        <div className="fy-actions mt-6">
          <button type="button" onClick={onReset} className={buttonSecondary}>
            {form.successButton}
          </button>
        </div>
      ) : null}
    </div>
  );
}

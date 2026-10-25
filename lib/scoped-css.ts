/** Keep owner CSS from closing its containing HTML style element. */
export function safeCssText(css: string): string {
  return css.replace(/<\/style/gi, "\\3C /style");
}

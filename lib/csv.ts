/** Escapes a single CSV cell and guards against spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(headers: string[], rows: readonly unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  // BOM so Excel opens UTF-8 files correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function csvFilename(prefix = "submissions"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}

// ============================================================================
// PropPilot — CSV serializer (Phase 9)
// ============================================================================
// A small, dependency-free CSV writer that follows RFC 4180:
//   - fields containing a comma, double-quote, CR or LF are wrapped in quotes;
//   - embedded double-quotes are escaped by doubling them;
//   - rows are joined with CRLF (the spec's line terminator), which Excel,
//     Google Sheets and Numbers all parse correctly.
//
// A leading UTF-8 BOM is prepended so spreadsheet apps detect UTF-8 and render
// non-ASCII text (e.g. Hindi/Marathi names) correctly. We also guard against
// CSV injection by prefixing values that begin with =, +, -, @ (or a tab/CR)
// with a single quote, so a malicious cell can't execute as a formula.

/** A single cell value before serialization. */
export type CsvCell = string | number | boolean | null | undefined;

/** Column definition: a header label and an accessor for each row. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvCell;
}

const FORMULA_PREFIXES = new Set(['=', '+', '-', '@']);

/** Normalise a single cell to a safe, escaped CSV field. */
function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return '';

  let s = typeof cell === 'string' ? cell : String(cell);

  // CSV-injection hardening: neutralise leading formula triggers.
  const first = s.charAt(0);
  if (FORMULA_PREFIXES.has(first) || first === '\t' || first === '\r') {
    s = `'${s}`;
  }

  // Quote when the field contains a delimiter, quote or line break.
  if (/[",\r\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

/** Serialize an array of rows into a CSV string using the given columns. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(','),
  );
  // Leading BOM + CRLF line endings.
  return '\uFEFF' + [headerLine, ...lines].join('\r\n') + '\r\n';
}

/** Build a safe, dated download filename, e.g. "proppilot-leads-2026-06-29.csv". */
export function exportFilename(kind: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safeKind = kind.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  return `proppilot-${safeKind}-${date}.csv`;
}

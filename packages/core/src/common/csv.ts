/**
 * Lecture CSV pure (B9.3, imports). Séparateur détecté (« ; » ou « , »),
 * guillemets doubles, BOM UTF-8, fins de ligne CRLF ou LF. Les en-têtes sont
 * normalisés (minuscules, sans accents ni espaces) pour tolérer les variantes.
 */
export interface CsvTable {
  headers: string[];
  rows: Record<string, string>[];
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function detectSeparator(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

export function parseCsv(input: string, maxRows = 1000): CsvTable {
  const text = input.replace(/^\uFEFF/, "");
  const separator = detectSeparator(text.split(/\r?\n/, 1)[0] ?? "");
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ""));
  const [head, ...body] = nonEmpty;
  const headers = (head ?? []).map(normalizeHeader);
  const rows = body
    .slice(0, maxRows)
    .map((cells) => Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()])));
  return { headers, rows };
}

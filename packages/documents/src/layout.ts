import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

import { BAND_COLORS, type BandShape } from "./band";

/**
 * Moteur de mise en page minimal au-dessus de pdf-lib (B5.1). Déterministe :
 * mêmes données, même date de génération → mêmes octets. Polices standard
 * (Helvetica) : pas de fichier de police à embarquer, rendu identique partout.
 */

export const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const FOOTER = 36;

export const COLORS = {
  ink: rgb(0.11, 0.12, 0.11),
  muted: rgb(0.42, 0.44, 0.42),
  field: rgb(0.12, 0.36, 0.29),
  ledger: rgb(0.62, 0.32, 0.12),
  rule: rgb(0.85, 0.84, 0.8),
  soft: rgb(0.95, 0.94, 0.91),
  danger: rgb(0.7, 0.15, 0.12),
};

/**
 * Les polices standard PDF ne couvrent que WinAnsi : on remplace les
 * caractères hors jeu (espaces insécables fines de `Intl`, guillemets
 * typographiques simples, flèches…) par des équivalents sûrs.
 */
export function sanitize(text: string): string {
  return text
    .replace(/[\u00a0\u2007\u2009\u202f]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2192/g, "->")
    .replace(/\u2026/g, "...")
    .replace(/[^\n\u0020-\u007e\u00a1-\u00ff\u0152\u0153\u20ac\u2013\u2014\u2022]/g, "?");
}

export interface Column {
  header: string;
  width: number; // proportion
  align?: "left" | "right";
}

export class Layout {
  readonly doc: PDFDocument;
  private font!: PDFFont;
  private bold!: PDFFont;
  private page!: PDFPage;
  private y = 0;
  private pages: PDFPage[] = [];

  private constructor(
    doc: PDFDocument,
    private readonly header: { left: string; right: string },
  ) {
    this.doc = doc;
  }

  static async create(meta: {
    title: string;
    author: string;
    generatedAt: Date;
    header: { left: string; right: string };
  }): Promise<Layout> {
    const doc = await PDFDocument.create();
    doc.setTitle(sanitize(meta.title));
    doc.setAuthor(sanitize(meta.author));
    doc.setProducer("MissionOps");
    doc.setCreator("MissionOps");
    doc.setCreationDate(meta.generatedAt);
    doc.setModificationDate(meta.generatedAt);
    const layout = new Layout(doc, meta.header);
    layout.font = await doc.embedFont(StandardFonts.Helvetica);
    layout.bold = await doc.embedFont(StandardFonts.HelveticaBold);
    layout.newPage();
    return layout;
  }

  get contentWidth(): number {
    return A4.width - 2 * MARGIN;
  }

  newPage(): void {
    this.page = this.doc.addPage([A4.width, A4.height]);
    this.pages.push(this.page);
    this.y = A4.height - MARGIN;
    this.page.drawText(sanitize(this.header.left), {
      x: MARGIN,
      y: this.y,
      size: 8,
      font: this.bold,
      color: COLORS.field,
    });
    const right = sanitize(this.header.right);
    this.page.drawText(right, {
      x: A4.width - MARGIN - this.font.widthOfTextAtSize(right, 8),
      y: this.y,
      size: 8,
      font: this.font,
      color: COLORS.muted,
    });
    this.y -= 8;
    this.rule();
    this.y -= 12;
  }

  /** Réserve `height` points ; change de page si nécessaire. */
  ensure(height: number): void {
    if (this.y - height < MARGIN + FOOTER) this.newPage();
  }

  space(points = 8): void {
    this.y -= points;
  }

  rule(color: RGB = COLORS.rule): void {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4.width - MARGIN, y: this.y },
      thickness: 0.6,
      color,
    });
  }

  private wrap(text: string, size: number, width: number, font: PDFFont): string[] {
    const lines: string[] = [];
    for (const paragraph of sanitize(text).split("\n")) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
        } else {
          if (line) lines.push(line);
          // Mot plus long que la ligne : on le coupe.
          let rest = word;
          while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
            let cut = rest.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut -= 1;
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
          line = rest;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  title(text: string, subtitle?: string): void {
    this.ensure(48);
    for (const line of this.wrap(text, 18, this.contentWidth, this.bold)) {
      this.y -= 20;
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 18,
        font: this.bold,
        color: COLORS.ink,
      });
    }
    if (subtitle) {
      this.y -= 14;
      this.page.drawText(sanitize(subtitle), {
        x: MARGIN,
        y: this.y,
        size: 10,
        font: this.font,
        color: COLORS.muted,
      });
    }
    this.y -= 14;
  }

  heading(text: string): void {
    this.ensure(36);
    this.y -= 14;
    this.page.drawText(sanitize(text).toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.bold,
      color: COLORS.field,
    });
    this.y -= 5;
    this.rule(COLORS.field);
    this.y -= 6;
  }

  paragraph(text: string, options: { size?: number; color?: RGB; bold?: boolean } = {}): void {
    const size = options.size ?? 10;
    const font = options.bold ? this.bold : this.font;
    for (const line of this.wrap(text, size, this.contentWidth, font)) {
      this.ensure(size + 4);
      this.y -= size + 3;
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font,
        color: options.color ?? COLORS.ink,
      });
    }
    this.y -= 3;
  }

  /** Paires libellé / valeur sur deux colonnes. */
  keyValues(pairs: [string, string][]): void {
    const labelWidth = 150;
    for (const [label, value] of pairs) {
      const lines = this.wrap(value || "—", 10, this.contentWidth - labelWidth, this.font);
      this.ensure(lines.length * 13 + 4);
      this.y -= 13;
      this.page.drawText(sanitize(label), {
        x: MARGIN,
        y: this.y,
        size: 9,
        font: this.font,
        color: COLORS.muted,
      });
      lines.forEach((line, i) => {
        this.page.drawText(line, {
          x: MARGIN + labelWidth,
          y: this.y - i * 13,
          size: 10,
          font: this.font,
          color: COLORS.ink,
        });
      });
      this.y -= (lines.length - 1) * 13;
    }
    this.y -= 4;
  }

  /** Tableau avec en-tête répété à chaque page et lignes de hauteur variable. */
  table(columns: Column[], rows: string[][], options: { totalRow?: string[] } = {}): void {
    const total = columns.reduce((acc, c) => acc + c.width, 0);
    const widths = columns.map((c) => (c.width / total) * this.contentWidth);
    const pad = 4;
    const drawHeader = () => {
      // En-tête + au moins une ligne : jamais d'en-tête orphelin en bas de page.
      this.ensure(48);
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - 16,
        width: this.contentWidth,
        height: 16,
        color: COLORS.soft,
      });
      let x = MARGIN;
      columns.forEach((c, i) => {
        const text = sanitize(c.header);
        const w = widths[i]!;
        const tx =
          c.align === "right" ? x + w - pad - this.bold.widthOfTextAtSize(text, 8) : x + pad;
        this.page.drawText(text, {
          x: tx,
          y: this.y - 11,
          size: 8,
          font: this.bold,
          color: COLORS.muted,
        });
        x += w;
      });
      this.y -= 16;
    };
    const drawRow = (cells: string[], bold = false) => {
      const font = bold ? this.bold : this.font;
      const wrapped = cells.map((cell, i) => this.wrap(cell ?? "", 9, widths[i]! - 2 * pad, font));
      const height = Math.max(...wrapped.map((w) => w.length)) * 11 + 6;
      if (this.y - height < MARGIN + FOOTER) {
        this.newPage();
        drawHeader();
      }
      let x = MARGIN;
      wrapped.forEach((lines, i) => {
        const w = widths[i]!;
        lines.forEach((line, j) => {
          const tx =
            columns[i]!.align === "right" ? x + w - pad - font.widthOfTextAtSize(line, 9) : x + pad;
          this.page.drawText(line, {
            x: tx,
            y: this.y - 11 - j * 11,
            size: 9,
            font,
            color: COLORS.ink,
          });
        });
        x += w;
      });
      this.y -= height;
      this.rule();
    };
    drawHeader();
    for (const row of rows) drawRow(row);
    if (options.totalRow) drawRow(options.totalRow, true);
    this.y -= 6;
  }

  /** Encadré mis en valeur (solde, statut). */
  callout(text: string, color: RGB = COLORS.ledger): void {
    const lines = this.wrap(text, 11, this.contentWidth - 20, this.bold);
    const height = lines.length * 14 + 12;
    this.ensure(height + 6);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - height,
      width: this.contentWidth,
      height,
      color: COLORS.soft,
      borderColor: color,
      borderWidth: 1,
    });
    lines.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN + 10,
        y: this.y - 18 - i * 14,
        size: 11,
        font: this.bold,
        color,
      });
    });
    this.y -= height + 8;
  }

  /** Bande de mission (B5.4) : même géométrie que le rendu SVG de l'écran. */
  band(shape: BandShape): void {
    const scale = this.contentWidth / shape.width;
    const height = shape.height * scale;
    this.ensure(height + 8);
    const top = this.y - 4;
    const X = (x: number) => MARGIN + x * scale;
    const Y = (y: number) => top - y * scale;
    const color = (hex: string) =>
      rgb(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      );
    this.page.drawLine({
      start: { x: X(shape.line.x1), y: Y(shape.line.y) },
      end: { x: X(shape.line.x2), y: Y(shape.line.y) },
      thickness: 2,
      color: color(BAND_COLORS.line),
    });
    this.page.drawLine({
      start: { x: X(shape.line.x1), y: Y(shape.line.y) },
      end: { x: X(shape.line.doneUntil), y: Y(shape.line.y) },
      thickness: 2,
      color: color(BAND_COLORS.done),
    });
    for (const n of shape.nodes) {
      const stroke = color(BAND_COLORS[n.state]);
      this.page.drawCircle({
        x: X(n.x),
        y: Y(n.y),
        size: n.r * scale,
        color: n.state === "upcoming" ? rgb(1, 1, 1) : stroke,
        borderColor: stroke,
        borderWidth: 1.5,
      });
      const label = sanitize(n.label);
      const size = 8;
      const font = n.state === "current" ? this.bold : this.font;
      this.page.drawText(label, {
        x: X(n.x) - font.widthOfTextAtSize(label, size) / 2,
        y: Y(n.y + 24),
        size,
        font,
        color: n.state === "upcoming" ? COLORS.muted : COLORS.ink,
      });
    }
    if (shape.balance) {
      const text = sanitize(shape.balance.text);
      this.page.drawText(text, {
        x: X(shape.balance.x) - this.bold.widthOfTextAtSize(text, 9) / 2,
        y: Y(shape.balance.y),
        size: 9,
        font: this.bold,
        color: COLORS.ledger,
      });
    }
    this.y -= height + 8;
  }

  /** Cases de signature côte à côte. */
  signatures(labels: string[]): void {
    const count = Math.max(labels.length, 1);
    const gap = 12;
    const width = (this.contentWidth - gap * (count - 1)) / count;
    this.ensure(90);
    this.y -= 8;
    labels.forEach((label, i) => {
      const x = MARGIN + i * (width + gap);
      this.page.drawRectangle({
        x,
        y: this.y - 70,
        width,
        height: 70,
        borderColor: COLORS.rule,
        borderWidth: 0.8,
      });
      this.page.drawText(sanitize(label), {
        x: x + 6,
        y: this.y - 12,
        size: 8,
        font: this.bold,
        color: COLORS.muted,
      });
    });
    this.y -= 80;
  }

  /** Image (justificatif) ajustée à la largeur disponible. */
  async image(bytes: Uint8Array, mimeType: string, caption: string): Promise<void> {
    let embedded;
    try {
      embedded =
        mimeType === "image/png" ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
    } catch {
      this.paragraph(caption, { color: COLORS.danger });
      return;
    }
    const maxWidth = this.contentWidth;
    const maxHeight = A4.height - 2 * MARGIN - FOOTER - 60;
    const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
    const w = embedded.width * Math.max(scale, Math.min(1, 200 / embedded.width));
    const h = embedded.height * (w / embedded.width);
    this.ensure(h + 24);
    this.paragraph(caption, { size: 8, color: COLORS.muted });
    this.page.drawImage(embedded, { x: MARGIN, y: this.y - h, width: w, height: h });
    this.y -= h + 10;
  }

  /** Pied de page sur toutes les pages : mention, pagination. */
  finish(footer: string, pageLabel: (page: number, total: number) => string): Promise<Uint8Array> {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      page.drawLine({
        start: { x: MARGIN, y: MARGIN + 14 },
        end: { x: A4.width - MARGIN, y: MARGIN + 14 },
        thickness: 0.4,
        color: COLORS.rule,
      });
      const left = sanitize(footer).slice(0, 140);
      page.drawText(left, { x: MARGIN, y: MARGIN, size: 7, font: this.font, color: COLORS.muted });
      const label = sanitize(pageLabel(index + 1, total));
      page.drawText(label, {
        x: A4.width - MARGIN - this.font.widthOfTextAtSize(label, 7),
        y: MARGIN,
        size: 7,
        font: this.font,
        color: COLORS.muted,
      });
    });
    return this.doc.save({ useObjectStreams: false });
  }
}

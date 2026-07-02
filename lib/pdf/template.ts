import {
  PDF_COLORS,
  PDF_PAGE,
  type Rgb
} from "@/lib/pdf/styles";

type FontName = "regular" | "bold" | "italic";

const PDF_FONTS: Record<FontName, string> = {
  regular: "F1",
  bold: "F2",
  italic: "F3"
};

function n(value: number) {
  return Number(value.toFixed(2));
}

function color(rgb: Rgb) {
  return `${rgb.map((item) => Number(item.toFixed(3))).join(" ")}`;
}

export function toPdfText(text: string) {
  return String(text ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfString(text: string) {
  return toPdfText(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function estimateTextWidth(text: string, size: number) {
  return toPdfText(text)
    .split("")
    .reduce((width, char) => {
      if (char === " ") return width + size * 0.28;
      if (/[A-Z0-9]/.test(char)) return width + size * 0.57;
      if (/[il.,'|]/.test(char)) return width + size * 0.26;
      return width + size * 0.5;
    }, 0);
}

export function wrapText(text: string, maxWidth: number, size: number) {
  const clean = toPdfText(text);
  if (!clean) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of clean.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = "";
    }

    if (estimateTextWidth(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    let fragment = "";
    for (const char of word) {
      const next = `${fragment}${char}`;
      if (estimateTextWidth(next, size) <= maxWidth) {
        fragment = next;
      } else {
        if (fragment) lines.push(fragment);
        fragment = char;
      }
    }
    current = fragment;
  }

  if (current) lines.push(current);
  return lines;
}

export function clampLines(lines: string[], maxLines?: number) {
  if (!maxLines || lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[kept.length - 1] = `${kept[kept.length - 1].replace(/[.,;:\s]+$/, "")}...`;
  return kept;
}

export class PdfTemplate {
  private pages: string[][] = [];
  private commands: string[] = [];
  private pageNumber = 0;
  y = 0;

  constructor(private readonly chromeTitle: string) {
    this.addPage();
  }

  addPage() {
    if (this.commands.length) this.pages.push(this.commands);
    this.pageNumber += 1;
    this.commands = [];
    this.y = PDF_PAGE.height - PDF_PAGE.marginTop;
    this.drawChrome();
  }

  reserve(height: number) {
    if (this.y - height < PDF_PAGE.marginBottom) {
      this.addPage();
    }
    const top = this.y;
    this.y -= height;
    return top;
  }

  gap(amount: number) {
    if (this.y - amount < PDF_PAGE.marginBottom) {
      this.addPage();
      return;
    }
    this.y -= amount;
  }

  rect({
    fill,
    height,
    stroke,
    strokeWidth = 0.6,
    width,
    x,
    y
  }: {
    fill?: Rgb;
    height: number;
    stroke?: Rgb;
    strokeWidth?: number;
    width: number;
    x: number;
    y: number;
  }) {
    if (fill) {
      this.commands.push(
        `q ${color(fill)} rg ${n(x)} ${n(y)} ${n(width)} ${n(height)} re f Q`
      );
    }
    if (stroke) {
      this.commands.push(
        `q ${color(stroke)} RG ${n(strokeWidth)} w ${n(x)} ${n(y)} ${n(width)} ${n(height)} re S Q`
      );
    }
  }

  line({
    color: lineColor = PDF_COLORS.rule,
    width = 0.6,
    x1,
    x2,
    y1,
    y2
  }: {
    color?: Rgb;
    width?: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  }) {
    this.commands.push(
      `q ${color(lineColor)} RG ${n(width)} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S Q`
    );
  }

  text({
    color: fill = PDF_COLORS.ink,
    font = "regular",
    size,
    text,
    x,
    y
  }: {
    color?: Rgb;
    font?: FontName;
    size: number;
    text: string;
    x: number;
    y: number;
  }) {
    const clean = escapePdfString(text);
    if (!clean) return;
    this.commands.push(
      `BT /${PDF_FONTS[font]} ${n(size)} Tf ${color(fill)} rg 1 0 0 1 ${n(x)} ${n(y)} Tm (${clean}) Tj ET`
    );
  }

  centeredText({
    color: fill = PDF_COLORS.ink,
    font = "regular",
    size,
    text,
    y
  }: {
    color?: Rgb;
    font?: FontName;
    size: number;
    text: string;
    y: number;
  }) {
    const clean = toPdfText(text);
    this.text({
      color: fill,
      font,
      size,
      text: clean,
      x: (PDF_PAGE.width - estimateTextWidth(clean, size)) / 2,
      y
    });
  }

  paragraph({
    color: fill = PDF_COLORS.ink,
    font = "regular",
    lineHeight = 13,
    maxLines,
    size,
    text,
    width,
    x
  }: {
    color?: Rgb;
    font?: FontName;
    lineHeight?: number;
    maxLines?: number;
    size: number;
    text: string;
    width: number;
    x: number;
  }) {
    const lines = clampLines(wrapText(text, width, size), maxLines);
    const height = Math.max(lines.length, 1) * lineHeight;
    this.reserve(height);
    let y = this.y + height - size;
    for (const line of lines) {
      this.text({ color: fill, font, size, text: line, x, y });
      y -= lineHeight;
    }
    return height;
  }

  centeredParagraph({
    color: fill = PDF_COLORS.ink,
    font = "regular",
    lineHeight = 14,
    maxLines,
    size,
    text,
    width,
    y
  }: {
    color?: Rgb;
    font?: FontName;
    lineHeight?: number;
    maxLines?: number;
    size: number;
    text: string;
    width: number;
    y: number;
  }) {
    const lines = clampLines(wrapText(text, width, size), maxLines);
    let cursor = y;
    for (const line of lines) {
      this.centeredText({ color: fill, font, size, text: line, y: cursor });
      cursor -= lineHeight;
    }
    return y - cursor;
  }

  drawWrappedTextAt({
    color: fill = PDF_COLORS.ink,
    font = "regular",
    lineHeight = 12,
    maxLines,
    size,
    text,
    width,
    x,
    y
  }: {
    color?: Rgb;
    font?: FontName;
    lineHeight?: number;
    maxLines?: number;
    size: number;
    text: string;
    width: number;
    x: number;
    y: number;
  }) {
    const lines = clampLines(wrapText(text, width, size), maxLines);
    let cursor = y;
    for (const line of lines) {
      this.text({ color: fill, font, size, text: line, x, y: cursor });
      cursor -= lineHeight;
    }
    return cursor;
  }

  tagRow({
    color: fill = PDF_COLORS.teal,
    maxWidth,
    size = 7.5,
    tags,
    x,
    y
  }: {
    color?: Rgb;
    maxWidth: number;
    size?: number;
    tags: string[];
    x: number;
    y: number;
  }) {
    let cursorX = x;
    let cursorY = y;
    const rowHeight = 17;
    for (const tag of tags) {
      const clean = toPdfText(tag);
      if (!clean) continue;
      const tagWidth = Math.min(estimateTextWidth(clean, size) + 14, maxWidth);
      if (cursorX + tagWidth > x + maxWidth) {
        cursorX = x;
        cursorY -= rowHeight;
      }
      this.rect({
        fill: PDF_COLORS.tag,
        stroke: PDF_COLORS.rule,
        x: cursorX,
        y: cursorY - 11,
        width: tagWidth,
        height: 15
      });
      this.text({
        color: fill,
        font: "bold",
        size,
        text: clean,
        x: cursorX + 7,
        y: cursorY - 6
      });
      cursorX += tagWidth + 5;
    }
    return cursorY - 14;
  }

  toBuffer() {
    if (this.commands.length) {
      this.pages.push(this.commands);
      this.commands = [];
    }

    const objects: string[] = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");

    const kids = this.pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
    objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>`);

    this.pages.forEach((commands, index) => {
      const pageObjectId = 3 + index * 2;
      const contentObjectId = pageObjectId + 1;
      const page = commands.join("\n");
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> >> >> /Contents ${contentObjectId} 0 R >>`
      );
      objects.push(`<< /Length ${Buffer.byteLength(page)} >>\nstream\n${page}\nendstream`);
    });

    const chunks = ["%PDF-1.4\n"];
    const offsets: number[] = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(chunks.join("")));
      chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });

    const xrefOffset = Buffer.byteLength(chunks.join(""));
    chunks.push(`xref\n0 ${objects.length + 1}\n`);
    chunks.push("0000000000 65535 f \n");
    offsets.slice(1).forEach((offset) => {
      chunks.push(`${offset.toString().padStart(10, "0")} 00000 n \n`);
    });
    chunks.push(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    );

    return Buffer.from(chunks.join(""));
  }

  private drawChrome() {
    this.centeredText({
      color: PDF_COLORS.muted,
      size: 8.8,
      text: this.chromeTitle,
      y: PDF_PAGE.height - 28
    });
    this.line({
      color: PDF_COLORS.rule,
      x1: PDF_PAGE.marginX,
      x2: PDF_PAGE.width - PDF_PAGE.marginX,
      y1: PDF_PAGE.height - 46,
      y2: PDF_PAGE.height - 46
    });
    this.centeredText({
      color: PDF_COLORS.muted,
      size: 7.2,
      text:
        "Anonymized portfolio notes. Source materials and unreleased details are not included.",
      y: 24
    });
    this.text({
      color: PDF_COLORS.muted,
      size: 7.2,
      text: `Page ${this.pageNumber}`,
      x: PDF_PAGE.width - PDF_PAGE.marginX - 34,
      y: 24
    });
  }
}

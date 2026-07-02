import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDF_CONFIDENTIALITY_NOTE,
  PDF_TITLE,
  PORTFOLIO_CATEGORIES
} from "@/lib/constants";
import { setSetting } from "@/lib/data/store";
import { isProductionDeployment } from "@/lib/env";
import { isPublicPortfolioStudy } from "@/lib/public-study";
import {
  getSupabaseAdmin,
  supabaseConfigurationError
} from "@/lib/supabase/server";
import type { Study } from "@/lib/types";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 15;
const MAX_LINES = 43;

function escapePdfText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "-");
}

function wrap(text: string, width = 84) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function makeLines(studies: Study[]) {
  const lines: Array<{ text: string; size?: number; gap?: boolean }> = [
    { text: PDF_TITLE, size: 20 },
    { text: `Export date: ${new Date().toLocaleDateString("en-US")}` },
    { text: PDF_CONFIDENTIALITY_NOTE },
    { text: " " }
  ];

  const approved = studies
    .filter((study) => study.status === "approved" && isPublicPortfolioStudy(study))
    .sort((a, b) => b.portfolio_score - a.portfolio_score);

  const topMajor = approved
    .filter((study) => study.portfolio_classification === "Major portfolio project")
    .slice(0, 5);

  lines.push({ text: "Top Major Projects", size: 16, gap: true });
  if (topMajor.length === 0) {
    lines.push({ text: "No major projects have been approved yet." });
  }
  for (const study of topMajor) {
    lines.push({ text: `${study.safe_public_title} (${study.recommended_section})`, size: 12 });
    wrap(study.case_study_summary || study.safe_public_description, 86).forEach((text) =>
      lines.push({ text: `  ${text}` })
    );
    if (study.skills_demonstrated.length) {
      lines.push({ text: `  Skills: ${study.skills_demonstrated.join(", ")}` });
    }
    lines.push({ text: " " });
  }

  for (const category of PORTFOLIO_CATEGORIES) {
    const items = approved.filter((study) => study.recommended_section === category);
    if (!items.length) continue;

    lines.push({ text: category, size: 16, gap: true });
    for (const study of items) {
      lines.push({
        text: `${study.safe_public_title} - ${study.portfolio_classification}`,
        size: 12
      });
      wrap(study.safe_public_description, 86).forEach((text) =>
        lines.push({ text: `  ${text}` })
      );
      lines.push({
        text: `  Platform: ${study.platform} | Type: ${study.study_type} | Duration: ${study.estimated_duration}`
      });
      if (study.skills_demonstrated.length) {
        lines.push({ text: `  Skills: ${study.skills_demonstrated.join(", ")}` });
      }
      lines.push({ text: " " });
    }
  }

  return lines;
}

function createPdfBuffer(studies: Study[]) {
  const lines = makeLines(studies);
  const pages: string[] = [];
  let current: typeof lines = [];
  let usedLines = 0;

  for (const line of lines) {
    const required = line.gap ? 2 : 1;
    if (usedLines + required > MAX_LINES) {
      pages.push(renderPage(current, pages.length + 1));
      current = [];
      usedLines = 0;
    }

    current.push(line);
    usedLines += required;
  }

  if (current.length) pages.push(renderPage(current, pages.length + 1));

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectId} 0 R >>`
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

function renderPage(lines: Array<{ text: string; size?: number; gap?: boolean }>, page: number) {
  let y = PAGE_HEIGHT - MARGIN;
  const parts = ["BT"];

  for (const line of lines) {
    if (line.text === " ") {
      y -= LINE_HEIGHT;
      continue;
    }

    if (line.gap) y -= 8;

    const size = line.size ?? 10;
    const font = size >= 16 ? "F2" : "F1";
    parts.push(`/${font} ${size} Tf`);
    parts.push(`${MARGIN} ${y} Td`);
    parts.push(`(${escapePdfText(line.text)}) Tj`);
    parts.push(`${-MARGIN} ${-y} Td`);
    y -= size >= 16 ? 22 : LINE_HEIGHT;
  }

  parts.push("/F1 9 Tf");
  parts.push(`${MARGIN} 34 Td`);
  parts.push(`(Page ${page} - ${escapePdfText(PDF_CONFIDENTIALITY_NOTE.slice(0, 86))}) Tj`);
  parts.push("ET");
  return parts.join("\n");
}

export async function generateAndStorePortfolioPdf(studies: Study[]) {
  const pdf = createPdfBuffer(studies);
  const filename = "living-ai-ux-portfolio-pranav-likhi.pdf";
  const supabase = getSupabaseAdmin();
  let publicUrl = `/exports/${filename}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from("portfolio-exports")
      .upload(filename, pdf, {
        contentType: "application/pdf",
        upsert: true
      });
    if (error) throw error;

    const { data } = supabase.storage
      .from("portfolio-exports")
      .getPublicUrl(filename);
    publicUrl = data.publicUrl;
  } else {
    const exportDir = join(process.cwd(), "public", "exports");
    if (isProductionDeployment()) {
      throw new Error(
        supabaseConfigurationError() ??
          "Supabase storage is required for production PDF exports. Local export fallback is disabled for launch."
      );
    }
    await mkdir(exportDir, { recursive: true });
    await writeFile(join(exportDir, filename), pdf);
  }

  await setSetting("pdf", {
    title: PDF_TITLE,
    latestUrl: publicUrl,
    lastGeneratedAt: new Date().toISOString()
  });

  return { publicUrl, buffer: pdf };
}

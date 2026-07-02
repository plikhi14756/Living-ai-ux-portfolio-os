import {
  PDF_CONFIDENTIALITY_NOTE,
  PDF_TITLE
} from "@/lib/constants";
import { isPublicPortfolioStudy } from "@/lib/public-study";
import {
  LIVING_PDF_CATEGORIES,
  PDF_COLORS,
  PDF_PAGE,
  PDF_SKILL_GROUPS
} from "@/lib/pdf/styles";
import {
  PdfTemplate,
  estimateTextWidth,
  toPdfText,
  wrapText
} from "@/lib/pdf/template";
import type { Study } from "@/lib/types";

type SkillGroup = {
  skills: string[];
  title: string;
};

type ExperienceSection = {
  entries: Study[];
  title: string;
};

type LivingPortfolioModel = {
  activeCategories: string[];
  featured: Study[];
  lastUpdated: string;
  platforms: string[];
  profile: string;
  publicStudies: Study[];
  sections: ExperienceSection[];
  skillGroups: SkillGroup[];
  topSkills: string[];
};

const CONTENT_WIDTH = PDF_PAGE.width - PDF_PAGE.marginX * 2;
const UNKNOWN_VALUES = new Set(["", "unknown", "n/a", "not visible"]);
const LIVING_CATEGORY_SET = new Set<string>(LIVING_PDF_CATEGORIES);

export function publicPortfolioStudies(studies: Study[]) {
  return studies
    .filter((study) => study.status === "approved" && isPublicPortfolioStudy(study))
    .sort((a, b) => b.portfolio_score - a.portfolio_score);
}

export function buildLivingPortfolioModel(studies: Study[]): LivingPortfolioModel {
  const publicStudies = publicPortfolioStudies(studies);
  const activeCategories = unique(
    publicStudies
      .map((study) => study.recommended_section)
      .filter((section) => LIVING_CATEGORY_SET.has(section))
  );
  const platforms = unique(
    publicStudies
      .map((study) => study.platform)
      .filter((platform) => !UNKNOWN_VALUES.has(platform.trim().toLowerCase()))
  ).slice(0, 8);
  const skills = unique(
    publicStudies.flatMap((study) => study.skills_demonstrated).filter(Boolean)
  );
  const topSkills = skills.slice(0, 18);
  const skillGroups = groupSkills(skills);
  const featured = publicStudies
    .filter(
      (study) =>
        study.portfolio_score >= 80 ||
        study.portfolio_classification === "Major portfolio project"
    )
    .slice(0, 6);
  const sections = LIVING_PDF_CATEGORIES.map((title) => ({
    title,
    entries: publicStudies.filter((study) => study.recommended_section === title)
  })).filter((section) => section.entries.length > 0);

  return {
    activeCategories,
    featured,
    lastUpdated: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }),
    platforms,
    profile: buildProfileSummary(activeCategories, topSkills),
    publicStudies,
    sections,
    skillGroups,
    topSkills
  };
}

export function createLivingPortfolioPdfBuffer(studies: Study[]) {
  const model = buildLivingPortfolioModel(studies);
  const doc = new PdfTemplate(
    "Pranav Likhi | AI UX Research & Product Evaluation Portfolio"
  );

  drawCover(doc, model);
  drawSkills(doc, model);
  drawFeaturedProjects(doc, model);
  drawExperienceSections(doc, model);
  drawConfidentialityNote(doc);

  return doc.toBuffer();
}

function drawCover(doc: PdfTemplate, model: LivingPortfolioModel) {
  doc.gap(10);
  doc.centeredText({
    color: PDF_COLORS.teal,
    font: "bold",
    size: 30,
    text: "Living AI UX Portfolio",
    y: doc.y
  });
  doc.gap(36);
  doc.centeredText({
    color: PDF_COLORS.ink,
    font: "regular",
    size: 17,
    text: "Pranav Likhi",
    y: doc.y
  });
  doc.gap(24);
  doc.centeredText({
    color: PDF_COLORS.ink,
    font: "bold",
    size: 10.8,
    text: "AI UX Research | Human-AI Interaction | AI Workflow Projects",
    y: doc.y
  });
  doc.gap(22);
  doc.centeredParagraph({
    color: PDF_COLORS.muted,
    size: 9.5,
    text:
      "A recruiter-readable living portfolio of approved AI evaluation, UX research participation, product feedback, and human-AI workflow evidence.",
    width: 410,
    y: doc.y
  });
  doc.gap(30);

  drawSnapshotTable(doc, model);
  doc.gap(24);

  drawSectionTitle(doc, "Profile", "Current positioning");
  doc.paragraph({
    color: PDF_COLORS.ink,
    lineHeight: 13.4,
    size: 9.4,
    text: model.profile,
    width: CONTENT_WIDTH,
    x: PDF_PAGE.marginX
  });
}

function drawSnapshotTable(doc: PdfTemplate, model: LivingPortfolioModel) {
  const headers = ["Focus", "Platforms", "Last updated"];
  const values = [
    listForCell([
      "AI UX research",
      "human-AI interaction",
      "AI workflow projects",
      ...model.activeCategories.slice(0, 3)
    ]),
    listForCell(model.platforms.length ? model.platforms : ["Approved public entries"]),
    `${model.lastUpdated}\n${model.publicStudies.length} public portfolio entries`
  ];
  const widths = [0.36, 0.34, 0.3].map((share) => CONTENT_WIDTH * share);
  const headerHeight = 23;
  const cellPadding = 8;
  const lineHeight = 10.6;
  const rowLines = values.map((value, index) =>
    wrapText(value, widths[index] - cellPadding * 2, 8.7)
  );
  const rowHeight =
    Math.max(...rowLines.map((lines) => lines.length), 2) * lineHeight + cellPadding * 2;
  const top = doc.reserve(headerHeight + rowHeight);
  let x = PDF_PAGE.marginX;

  headers.forEach((header, index) => {
    doc.rect({
      fill: PDF_COLORS.teal,
      height: headerHeight,
      width: widths[index],
      x,
      y: top - headerHeight
    });
    doc.text({
      color: PDF_COLORS.paper,
      font: "bold",
      size: 9.5,
      text: header,
      x: x + cellPadding,
      y: top - 15
    });
    x += widths[index];
  });

  x = PDF_PAGE.marginX;
  values.forEach((value, index) => {
    doc.rect({
      fill: PDF_COLORS.tealSoft,
      height: rowHeight,
      stroke: PDF_COLORS.rule,
      width: widths[index],
      x,
      y: top - headerHeight - rowHeight
    });
    doc.drawWrappedTextAt({
      color: PDF_COLORS.ink,
      lineHeight,
      size: 8.7,
      text: value,
      width: widths[index] - cellPadding * 2,
      x: x + cellPadding,
      y: top - headerHeight - cellPadding - 7
    });
    x += widths[index];
  });
}

function drawSkills(doc: PdfTemplate, model: LivingPortfolioModel) {
  if (!model.skillGroups.length) return;

  doc.gap(28);
  drawSectionTitle(doc, "Skills Snapshot", "Auto-grouped from approved entries");

  const columns = 2;
  const gap = 14;
  const cardWidth = (CONTENT_WIDTH - gap) / columns;

  for (let index = 0; index < model.skillGroups.length; index += columns) {
    const row = model.skillGroups.slice(index, index + columns);
    const heights = row.map((group) =>
      skillCardHeight(group, cardWidth)
    );
    const rowHeight = Math.max(...heights);
    const top = doc.reserve(rowHeight);

    row.forEach((group, columnIndex) => {
      const x = PDF_PAGE.marginX + columnIndex * (cardWidth + gap);
      drawSkillCard(doc, group, x, top, cardWidth, rowHeight);
    });
    doc.gap(10);
  }
}

function drawFeaturedProjects(doc: PdfTemplate, model: LivingPortfolioModel) {
  if (!model.featured.length) return;

  doc.gap(20);
  ensureSectionStart(doc, 54 + measureProjectCardHeight(model.featured[0], true));
  drawSectionTitle(doc, "Featured / Major Projects", "High-score approved work");

  for (const study of model.featured) {
    drawProjectCard(doc, study, true);
    doc.gap(10);
  }
}

function drawExperienceSections(doc: PdfTemplate, model: LivingPortfolioModel) {
  if (!model.sections.length) return;

  doc.gap(18);
  ensureSectionStart(doc, 170);
  drawSectionTitle(doc, "Experience Sections", "Approved public entries only");

  for (const section of model.sections) {
    ensureSectionStart(doc, 48 + measureProjectCardHeight(section.entries[0], false));
    const sectionHeight = 34;
    const top = doc.reserve(sectionHeight);
    doc.rect({
      fill: PDF_COLORS.teal,
      height: 22,
      width: CONTENT_WIDTH,
      x: PDF_PAGE.marginX,
      y: top - 22
    });
    doc.text({
      color: PDF_COLORS.paper,
      font: "bold",
      size: 11,
      text: section.title,
      x: PDF_PAGE.marginX + 10,
      y: top - 15
    });
    doc.text({
      color: PDF_COLORS.paper,
      size: 8,
      text: `${section.entries.length} approved entry${section.entries.length === 1 ? "" : "s"}`,
      x: PDF_PAGE.width - PDF_PAGE.marginX - 90,
      y: top - 15
    });
    doc.gap(2);

    for (const study of section.entries) {
      drawProjectCard(doc, study, false);
      doc.gap(8);
    }
    doc.gap(8);
  }
}

function drawConfidentialityNote(doc: PdfTemplate) {
  doc.gap(14);
  ensureSectionStart(doc, 110);
  drawSectionTitle(doc, "Confidentiality Note", "Public-safe summaries");
  doc.paragraph({
    color: PDF_COLORS.muted,
    font: "italic",
    lineHeight: 12.5,
    size: 8.6,
    text: PDF_CONFIDENTIALITY_NOTE,
    width: CONTENT_WIDTH,
    x: PDF_PAGE.marginX
  });
}

function drawSectionTitle(doc: PdfTemplate, title: string, eyebrow?: string) {
  const height = eyebrow ? 42 : 32;
  const top = doc.reserve(height);
  if (eyebrow) {
    doc.text({
      color: PDF_COLORS.gold,
      font: "bold",
      size: 7.6,
      text: eyebrow.toUpperCase(),
      x: PDF_PAGE.marginX,
      y: top - 9
    });
  }
  doc.text({
    color: PDF_COLORS.teal,
    font: "bold",
    size: 18,
    text: title,
    x: PDF_PAGE.marginX,
    y: top - (eyebrow ? 29 : 18)
  });
  doc.line({
    color: PDF_COLORS.rule,
    x1: PDF_PAGE.marginX,
    x2: PDF_PAGE.width - PDF_PAGE.marginX,
    y1: top - height + 5,
    y2: top - height + 5
  });
}

function ensureSectionStart(doc: PdfTemplate, minHeight: number) {
  if (doc.y - minHeight < PDF_PAGE.marginBottom) {
    doc.addPage();
  }
}

function drawSkillCard(
  doc: PdfTemplate,
  group: SkillGroup,
  x: number,
  top: number,
  width: number,
  height: number
) {
  doc.rect({
    fill: PDF_COLORS.sand,
    stroke: PDF_COLORS.rule,
    height,
    width,
    x,
    y: top - height
  });
  doc.rect({
    fill: PDF_COLORS.teal,
    height,
    width: 4,
    x,
    y: top - height
  });
  doc.text({
    color: PDF_COLORS.teal,
    font: "bold",
    size: 10.2,
    text: group.title,
    x: x + 12,
    y: top - 16
  });
  doc.tagRow({
    tags: group.skills.slice(0, 8),
    maxWidth: width - 24,
    x: x + 12,
    y: top - 35
  });
}

function drawProjectCard(doc: PdfTemplate, study: Study, featured: boolean) {
  const width = CONTENT_WIDTH;
  const title = publicText(study.safe_public_title || study.study_title);
  const body = publicText(study.case_study_summary || study.safe_public_description);
  const meta = compact([
    study.recommended_section,
    study.portfolio_classification,
    scoreLabel(study.portfolio_score),
    cleanMeta(study.platform),
    cleanMeta(study.study_type),
    cleanMeta(study.estimated_duration)
  ]).join(" | ");
  const titleLines = wrapText(title, width - 28, featured ? 11.5 : 10.3);
  const bodyLines = wrapText(body, width - 28, featured ? 9.1 : 8.6);
  const metaLines = wrapText(meta, width - 28, 7.8);
  const tags = study.skills_demonstrated.slice(0, featured ? 8 : 5);
  const actualHeight = measureProjectCardHeight(study, featured);
  const top = doc.reserve(actualHeight);
  const fill = featured ? PDF_COLORS.cyanSoft : PDF_COLORS.tealSoft;

  doc.rect({
    fill,
    stroke: PDF_COLORS.rule,
    height: actualHeight,
    width,
    x: PDF_PAGE.marginX,
    y: top - actualHeight
  });
  doc.rect({
    fill: featured ? PDF_COLORS.gold : PDF_COLORS.teal,
    height: actualHeight,
    width: 5,
    x: PDF_PAGE.marginX,
    y: top - actualHeight
  });

  let y = top - 18;
  y = doc.drawWrappedTextAt({
    color: PDF_COLORS.teal,
    font: "bold",
    lineHeight: 14,
    maxLines: 2,
    size: featured ? 11.5 : 10.3,
    text: title,
    width: width - 28,
    x: PDF_PAGE.marginX + 14,
    y
  }) - 3;
  y = doc.drawWrappedTextAt({
    color: PDF_COLORS.ink,
    lineHeight: 11.5,
    maxLines: featured ? 5 : 3,
    size: featured ? 9.1 : 8.6,
    text: body,
    width: width - 28,
    x: PDF_PAGE.marginX + 14,
    y
  }) - 4;
  y = doc.drawWrappedTextAt({
    color: PDF_COLORS.muted,
    lineHeight: 10,
    maxLines: 2,
    size: 7.8,
    text: meta,
    width: width - 28,
    x: PDF_PAGE.marginX + 14,
    y
  }) - 5;

  if (tags.length) {
    doc.tagRow({
      tags,
      maxWidth: width - 28,
      x: PDF_PAGE.marginX + 14,
      y
    });
  }
}

function measureProjectCardHeight(study: Study, featured: boolean) {
  const width = CONTENT_WIDTH;
  const title = publicText(study.safe_public_title || study.study_title);
  const body = publicText(study.case_study_summary || study.safe_public_description);
  const meta = compact([
    study.recommended_section,
    study.portfolio_classification,
    scoreLabel(study.portfolio_score),
    cleanMeta(study.platform),
    cleanMeta(study.study_type),
    cleanMeta(study.estimated_duration)
  ]).join(" | ");
  const titleLines = wrapText(title, width - 28, featured ? 11.5 : 10.3);
  const bodyLines = wrapText(body, width - 28, featured ? 9.1 : 8.6);
  const metaLines = wrapText(meta, width - 28, 7.8);
  const tags = study.skills_demonstrated.slice(0, featured ? 8 : 5);
  const tagRows = countTagRows(tags, width - 28);
  const height =
    20 +
    titleLines.length * 14 +
    Math.min(bodyLines.length, featured ? 5 : 3) * 11.5 +
    metaLines.length * 10 +
    (tags.length ? tagRows * 17 + 8 : 0) +
    22;

  return Math.max(height, featured ? 110 : 86);
}

function skillCardHeight(group: SkillGroup, width: number) {
  return 54 + countTagRows(group.skills.slice(0, 8), width - 24) * 17;
}

function countTagRows(tags: string[], maxWidth: number) {
  let rows = 1;
  let cursor = 0;
  for (const tag of tags) {
    const tagWidth = Math.min(estimateTextWidth(tag, 7.5) + 19, maxWidth);
    if (cursor && cursor + tagWidth > maxWidth) {
      rows += 1;
      cursor = 0;
    }
    cursor += tagWidth + 5;
  }
  return tags.length ? rows : 0;
}

function groupSkills(skills: string[]) {
  const remaining = new Set(skills.map(publicText).filter(Boolean));
  const groups: SkillGroup[] = [];

  for (const group of PDF_SKILL_GROUPS) {
    const matched = [...remaining].filter((skill) => {
      const lower = skill.toLowerCase();
      return group.keywords.some((keyword) => lower.includes(keyword));
    });
    if (!matched.length) continue;
    matched.slice(0, 10).forEach((skill) => remaining.delete(skill));
    groups.push({ title: group.title, skills: matched.slice(0, 10) });
  }

  if (remaining.size) {
    groups.push({
      title: "Additional Research Skills",
      skills: [...remaining].slice(0, 12)
    });
  }

  return groups.slice(0, 9);
}

function buildProfileSummary(activeCategories: string[], topSkills: string[]) {
  const categoryText =
    activeCategories.length > 0
      ? activeCategories.slice(0, 6).join(", ")
      : "AI UX research, human-AI interaction, and product feedback";
  const skillText =
    topSkills.length > 0
      ? topSkills.slice(0, 8).join(", ")
      : "structured feedback, human-AI interaction analysis, and usability research participation";

  return `Pranav Likhi is building toward AI UX Research and Human-AI Interaction work through approved public evidence across ${categoryText}. This living portfolio emphasizes high-level, confidentiality-safe summaries of research participation, AI evaluation, product feedback, and workflow-building experience. Current recurring skill signals include ${skillText}.`;
}

function scoreLabel(score: number) {
  return `Portfolio score ${Math.round(score)}/100`;
}

function cleanMeta(value: string) {
  const clean = publicText(value);
  return UNKNOWN_VALUES.has(clean.toLowerCase()) ? "" : clean;
}

function publicText(value: string) {
  return toPdfText(value)
    .replace(/\bcompletion code\b/gi, "private code")
    .replace(/\bstudy id\b/gi, "private study reference")
    .replace(/\bscreenshot\b/gi, "source material");
}

function listForCell(items: string[]) {
  return unique(items.map(publicText).filter(Boolean)).slice(0, 8).join(", ");
}

function compact(items: string[]) {
  return items.filter((item) => item && !UNKNOWN_VALUES.has(item.toLowerCase()));
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => publicText(item)).filter(Boolean))];
}

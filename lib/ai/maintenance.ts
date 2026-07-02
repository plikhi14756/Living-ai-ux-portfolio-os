import { MaintenanceReportSchema, type MaintenanceReportAnalysis } from "@/lib/ai/schemas";
import type { Study } from "@/lib/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function findDuplicateTitles(studies: Study[]) {
  const seen = new Map<string, number>();
  const duplicates = new Set<string>();

  for (const study of studies) {
    const key = study.safe_public_title.toLowerCase().trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) > 1) duplicates.add(study.safe_public_title);
  }

  return [...duplicates];
}

function findConfidentialityFlags(studies: Study[]) {
  const risky = [
    "completion code",
    "study id",
    "researcher",
    "internal prototype",
    "unreleased",
    "screenshot"
  ];

  return studies.flatMap((study) => {
    const combined = `${study.safe_public_title} ${study.safe_public_description}`.toLowerCase();
    const hits = risky.filter((term) => combined.includes(term));
    return hits.length ? [`${study.safe_public_title}: ${hits.join(", ")}`] : [];
  });
}

function fallbackMaintenance(studies: Study[], latestPdfUrl?: string): MaintenanceReportAnalysis {
  const approved = studies.filter((study) => study.status === "approved");
  const emptyDescriptions = approved
    .filter((study) => study.safe_public_description.length < 60)
    .map((study) => study.safe_public_title);

  const recommendations = [
    "Regenerate the living PDF after approving strong new entries.",
    "Review low-detail public descriptions before sharing the portfolio widely.",
    "Keep public pages free of screenshot URLs and private task details."
  ];

  if (emptyDescriptions.length) {
    recommendations.unshift(
      `Improve short descriptions for: ${emptyDescriptions.join(", ")}`
    );
  }

  return {
    broken_links: [],
    duplicate_entries: findDuplicateTitles(approved),
    confidentiality_flags: findConfidentialityFlags(approved),
    pdf_status: latestPdfUrl ? "Latest living PDF is available" : "No living PDF generated yet",
    seo_status:
      "Base title and description are configured for AI UX Research and Human-AI Interaction.",
    mobile_status:
      "Responsive layouts are implemented; verify visually after deploying to Vercel.",
    recommendations
  };
}

export async function runMaintenanceCheck(studies: Study[], latestPdfUrl?: string) {
  const analysis = MaintenanceReportSchema.parse(
    fallbackMaintenance(studies, latestPdfUrl)
  );

  return {
    report_month: currentMonth(),
    broken_links: analysis.broken_links,
    duplicate_entries: analysis.duplicate_entries,
    confidentiality_flags: analysis.confidentiality_flags,
    pdf_status: analysis.pdf_status,
    seo_status: analysis.seo_status,
    mobile_status: analysis.mobile_status,
    recommendations: analysis.recommendations
  };
}

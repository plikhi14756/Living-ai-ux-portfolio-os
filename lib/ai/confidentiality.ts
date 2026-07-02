const sensitivePatterns = [
  /\b[A-Z0-9]{4,}[-_][A-Z0-9]{4,}\b/g,
  /\bcompletion code\b/gi,
  /\bstudy id\b/gi,
  /\bresearcher name\b/gi,
  /\bprototype name\b/gi
];

export function confidentialityGuard(text: string) {
  let safe = text || "unknown";

  for (const pattern of sensitivePatterns) {
    safe = safe.replace(pattern, "confidential detail");
  }

  return safe
    .replace(/\s+/g, " ")
    .replace(/\b(unreleased|private|confidential)\s+confidential detail/gi, "confidential detail")
    .trim();
}

export function normalizeUnknown(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? confidentialityGuard(trimmed) : "unknown";
}

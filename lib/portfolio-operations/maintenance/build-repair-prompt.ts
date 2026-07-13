import type { MaintenanceIssue, MaintenanceSeverity } from "@/lib/types";

function redactSensitiveText(value: string) {
  return value.replace(
    /\b(OPENAI_API_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET|ADMIN_ACCESS_TOKEN|RESEND_API_KEY|EMAIL_FROM)=\S*/g,
    "$1=[redacted]"
  );
}

export function buildCodexRepairPrompt(input: {
  title: string;
  severity: MaintenanceSeverity;
  category: string;
  affected?: string;
  evidence: string;
  expected: string;
  suggestedAction: string;
}) {
  const affected = redactSensitiveText(input.affected ?? "Not specified");
  const evidence = redactSensitiveText(input.evidence);
  const expected = redactSensitiveText(input.expected);
  const suggestedAction = redactSensitiveText(input.suggestedAction);

  return `Repair a Living AI UX Portfolio OS maintenance issue.

Project context:
- Existing production Next.js App Router, TypeScript, Supabase, OpenAI, Vercel application.
- Preserve existing architecture, admin authorization, privacy filters, public routes, and protected admin routes.
- Inspect the repository before changing code. Do not commit or push.

Issue:
- Title: ${input.title}
- Severity: ${input.severity}
- Category: ${input.category}
- Affected route/table/file/record: ${affected}

Observed evidence:
- ${evidence}

Expected behavior:
- ${expected}

Security and privacy constraints:
- Do not expose admin tokens, cron secrets, Supabase service-role keys, OpenAI keys, Resend keys, private screenshots, confidential study prompts, completion codes, researcher names, or participant data.
- Keep public pages limited to approved portfolio-worthy entries.
- Keep record-only, rejected, low-score, private, and superseded entries out of public queries.
- Do not access production Supabase directly unless the user explicitly instructs you to use production credentials.

Requested repair:
- ${suggestedAction}

Validation steps:
- Run npm run typecheck.
- Run npm run lint if available.
- Run the repository test command if available.
- Run npm run build.
- Report exact command results.`;
}

export function buildPromptFromIssue(issue: MaintenanceIssue) {
  return buildCodexRepairPrompt({
    title: issue.title,
    severity: issue.severity,
    category: issue.category,
    affected: [issue.affected_record_type, issue.affected_record_id].filter(Boolean).join(":"),
    evidence: issue.human_summary,
    expected: issue.suggested_action,
    suggestedAction: issue.suggested_action
  });
}

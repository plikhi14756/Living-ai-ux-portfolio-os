import { describe, expect, it } from "vitest";
import { buildCodexRepairPrompt } from "@/lib/portfolio-operations/maintenance/build-repair-prompt";
import {
  runIsolatedMaintenanceChecks,
  runMaintenanceChecks,
  toMaintenanceIssueInput
} from "@/lib/portfolio-operations/maintenance/registry";
import { maintenanceContext, study } from "@/tests/factories";

describe("maintenance checks", () => {
  it("keeps running checks when one check fails", async () => {
    const results = await runIsolatedMaintenanceChecks(maintenanceContext(), [
      function failingCheck() {
        throw new Error("Broken check");
      },
      function passingCheck() {
        return [
          {
            key: "passing",
            category: "test",
            severity: "info",
            title: "Passing check",
            humanSummary: "The second check completed.",
            technicalDetails: {},
            suggestedAction: "No action."
          }
        ];
      }
    ]);

    expect(results.map((result) => result.key)).toEqual(
      expect.arrayContaining(["maintenance-check-failed-failingCheck", "passing"])
    );
  });

  it("classifies public privacy leakage as critical", async () => {
    const publicStudy = study({
      id: "public-1",
      safe_public_description: "This mentions a completion code in public copy."
    });
    const results = await runMaintenanceChecks(
      maintenanceContext({
        studies: [publicStudy],
        publicStudyIds: new Set(["public-1"])
      })
    );

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "privacy-public-copy-public-1",
          severity: "critical"
        })
      ])
    );
  });

  it("builds deterministic repair prompts without secret values", () => {
    const first = buildCodexRepairPrompt({
      title: "Broken route",
      severity: "warning",
      category: "links",
      affected: "/portfolio",
      evidence: "ADMIN_ACCESS_TOKEN=secret-value was not copied into the issue.",
      expected: "Public links should work.",
      suggestedAction: "Repair the link."
    });
    const second = buildCodexRepairPrompt({
      title: "Broken route",
      severity: "warning",
      category: "links",
      affected: "/portfolio",
      evidence: "ADMIN_ACCESS_TOKEN=secret-value was not copied into the issue.",
      expected: "Public links should work.",
      suggestedAction: "Repair the link."
    });

    expect(first).toBe(second);
    expect(first).not.toContain("secret-value");
    expect(first).not.toContain("CRON_SECRET=");
    expect(first).not.toContain("RESEND_API_KEY=");
  });

  it("creates stable maintenance issue fingerprints", () => {
    const result = {
      key: "privacy-public-copy-public-1",
      category: "privacy",
      severity: "critical" as const,
      title: "Privacy issue",
      humanSummary: "Sensitive copy",
      technicalDetails: {},
      affectedRecordType: "study",
      affectedRecordId: "public-1",
      suggestedAction: "Rewrite copy"
    };

    const first = toMaintenanceIssueInput(result, "run-1", "2026-07-13T10:00:00.000Z");
    const second = toMaintenanceIssueInput(result, "run-2", "2026-07-13T11:00:00.000Z");

    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it("supports severity aggregation from issue results", async () => {
    const results = await runIsolatedMaintenanceChecks(maintenanceContext(), [
      () => [
        {
          key: "critical",
          category: "privacy",
          severity: "critical",
          title: "Critical",
          humanSummary: "Critical issue",
          technicalDetails: {},
          suggestedAction: "Fix"
        },
        {
          key: "warning",
          category: "links",
          severity: "warning",
          title: "Warning",
          humanSummary: "Warning issue",
          technicalDetails: {},
          suggestedAction: "Fix"
        }
      ]
    ]);

    expect(results.filter((result) => result.severity === "critical")).toHaveLength(1);
    expect(results.filter((result) => result.severity === "warning")).toHaveLength(1);
  });
});

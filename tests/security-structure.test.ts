import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SERVER_ONLY_IMPORTS = [
  "@/lib/supabase/server",
  "@/lib/data/store",
  "@/lib/portfolio-operations/email/send-email",
  "@/lib/portfolio-operations/maintenance/run-maintenance"
];

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") return [];
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("client/server boundaries", () => {
  it("does not import server-only modules from Client Components", () => {
    const clientFiles = [...filesUnder("app"), ...filesUnder("components")].filter((file) => {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) return false;
      return readFileSync(file, "utf8").startsWith('"use client";');
    });

    const violations = clientFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return SERVER_ONLY_IMPORTS.filter((importPath) => source.includes(importPath)).map(
        (importPath) => `${file} imports ${importPath}`
      );
    });

    expect(violations).toEqual([]);
  });
});

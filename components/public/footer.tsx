import Link from "next/link";
import { CONFIDENTIALITY_NOTE, SITE_BRAND_LINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 py-10 dark:border-white/10">
      <div className="container-page grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm font-bold text-ink dark:text-paper">
            {SITE_BRAND_LINE}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/64 dark:text-paper/64">
            {CONFIDENTIALITY_NOTE}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Link className="btn-secondary" href="/portfolio">
            Living Portfolio
          </Link>
          <Link className="btn-secondary" href="/api/pdf/latest">
            PDF Portfolio
          </Link>
        </div>
      </div>
    </footer>
  );
}

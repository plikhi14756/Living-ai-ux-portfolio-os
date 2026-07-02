import { PortfolioFilter } from "@/components/public/portfolio-filter";
import { PublicShell } from "@/components/public/public-shell";
import { listPublicStudies } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Living Portfolio"
};

export default async function PortfolioPage() {
  const studies = await listPublicStudies();

  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Full Living Portfolio</p>
        <h1 className="mt-3 text-4xl font-black">Approved AI UX and research evidence</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          Search and filter safe public summaries by category, platform, skill,
          and study type. Private screenshots, study IDs, and unreleased product
          details stay out of the public portfolio.
        </p>
      </section>
      <section className="container-page pb-12">
        <PortfolioFilter studies={studies} />
      </section>
    </PublicShell>
  );
}

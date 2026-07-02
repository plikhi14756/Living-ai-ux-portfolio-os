import { PublicShell } from "@/components/public/public-shell";
import { listPublicStudies } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Experience Log"
};

export default async function ExperienceLogPage() {
  const studies = await listPublicStudies();

  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Chronological Approved Study Log</p>
        <h1 className="mt-3 text-4xl font-black">Living research participation record</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          Safe public summaries only. Screenshots, researcher names, study IDs,
          completion codes, and unreleased product details are intentionally not
          published.
        </p>
      </section>
      <section className="container-page pb-12">
        <div className="space-y-4 border-l border-ink/15 pl-4 dark:border-white/15">
          {studies.map((study) => (
            <article className="card relative" key={study.id}>
              <span className="absolute -left-[1.72rem] top-6 h-3 w-3 rounded-full border-2 border-paper bg-moss dark:border-[#131818] dark:bg-cyan" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-ink/56 dark:text-paper/56">
                    {new Date(study.published_at ?? study.created_at).toLocaleDateString("en-US")}
                  </p>
                  <h2 className="mt-2 text-xl font-bold">{study.safe_public_title}</h2>
                </div>
                <span className="tag">{study.recommended_section}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-paper/70">
                {study.safe_public_description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

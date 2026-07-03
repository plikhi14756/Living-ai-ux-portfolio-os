import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { StudyCard } from "@/components/study-card";
import { listPublicStudies } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects"
};

export default async function ProjectsPage() {
  const studies = await listPublicStudies();
  const projects = studies
    .filter(
      (study) =>
        study.portfolio_classification === "Major portfolio project" ||
        study.recommended_section === "Major AI UX Projects"
    )
    .sort((a, b) => b.portfolio_score - a.portfolio_score);

  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Major Portfolio Projects</p>
        <h1 className="mt-3 text-4xl font-black">Case-study-style AI UX entries</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          These are the strongest approved experiences: longer studies,
          moderated sessions, prototype evaluations, fintech UX work,
          conversational AI, voice AI, multilingual evaluation, and human-AI
          interaction evidence.
        </p>
      </section>

      <section className="container-page pb-6">
        <article className="card grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Featured Case Study</p>
            <h2 className="mt-3 text-3xl font-black">
              Living AI UX Portfolio OS
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/72 dark:text-paper/72">
              A human-in-the-loop AI workflow for turning research-study
              evidence into a living public portfolio website and branded PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:justify-end">
            <Link
              className="btn-primary"
              href="/projects/living-ai-ux-portfolio-os"
            >
              Read case study
            </Link>
            <Link className="btn-secondary" href="/documents">
              Open branded living PDF
            </Link>
          </div>
        </article>
      </section>

      <section className="container-page grid gap-4 pb-12 md:grid-cols-2">
        {projects.map((study) => (
          <div className="space-y-4" key={study.id}>
            <StudyCard study={study} />
            {study.safe_public_title === "Living AI UX Portfolio OS" ? (
              <div className="subtle-card flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold">
                  Read the full build and workflow case study.
                </p>
                <Link
                  className="btn-primary"
                  href="/projects/living-ai-ux-portfolio-os"
                >
                  Read case study
                </Link>
              </div>
            ) : null}
            {study.case_study_summary ? (
              <div className="subtle-card">
                <p className="text-sm font-bold">Case-study summary</p>
                <p className="mt-2 text-sm leading-6 text-ink/68 dark:text-paper/68">
                  {study.case_study_summary}
                </p>
              </div>
            ) : null}
          </div>
        ))}
        {projects.length === 0 ? (
          <div className="card md:col-span-2">
            No major projects have been approved yet.
          </div>
        ) : null}
      </section>
    </PublicShell>
  );
}

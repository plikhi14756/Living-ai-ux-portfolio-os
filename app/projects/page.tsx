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
      <section className="container-page grid gap-4 pb-12 md:grid-cols-2">
        {projects.map((study) => (
          <div className="space-y-4" key={study.id}>
            <StudyCard study={study} />
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

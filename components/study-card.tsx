import Link from "next/link";
import { LIVING_AI_UX_PORTFOLIO_OS_CASE_STUDY_PATH } from "@/lib/case-studies";
import type { PublicStudy } from "@/lib/public-study";
import type { Study } from "@/lib/types";

type StudyCardProps = {
  study: PublicStudy | Study;
  admin?: boolean;
};

export function StudyCard({ study, admin = false }: StudyCardProps) {
  const caseStudyHref =
    !admin && study.safe_public_title === "Living AI UX Portfolio OS"
      ? LIVING_AI_UX_PORTFOLIO_OS_CASE_STUDY_PATH
      : null;

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{study.recommended_section}</p>
          <h3 className="mt-2 text-xl font-bold text-ink dark:text-paper">
            {caseStudyHref ? (
              <Link className="transition hover:text-moss dark:hover:text-cyan" href={caseStudyHref}>
                {study.safe_public_title}
              </Link>
            ) : (
              study.safe_public_title
            )}
          </h3>
        </div>
        <span className="tag">{study.portfolio_score}/100</span>
      </div>

      <p className="text-sm leading-6 text-ink/72 dark:text-paper/72">
        {study.safe_public_description}
      </p>

      <div className="flex flex-wrap gap-2">
        {study.skills_demonstrated.slice(0, 5).map((skill) => (
          <span className="tag" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-ink/58 dark:text-paper/58">
        <span>{study.platform}</span>
        <span>/</span>
        <span>{study.study_type}</span>
        <span>/</span>
        <span>{study.estimated_duration}</span>
      </div>

      {caseStudyHref ? (
        <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-4 dark:border-white/10">
          <Link className="btn-primary" href={caseStudyHref}>
            Read case study
          </Link>
        </div>
      ) : null}

      {admin ? (
        <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-4 dark:border-white/10">
          <Link className="btn-secondary" href={`/admin/review/${study.id}`}>
            Review
          </Link>
          <Link className="btn-secondary" href={`/admin/edit/${study.id}`}>
            Edit
          </Link>
        </div>
      ) : null}
    </article>
  );
}

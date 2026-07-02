import { notFound } from "next/navigation";
import { ReviewActions } from "@/components/forms/review-actions";
import { OPENAI_QUOTA_MESSAGE } from "@/lib/ai/analyze-study";
import { getStudy } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Study"
};

export default async function ReviewStudyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const study = await getStudy(id);
  if (!study) notFound();
  const quotaBlocked =
    study.approval_status === OPENAI_QUOTA_MESSAGE ||
    study.missing_questions.includes(OPENAI_QUOTA_MESSAGE);
  const canPublish =
    study.portfolio_score >= 30 &&
    study.portfolio_classification !== "Record only" &&
    study.portfolio_classification !== "Do not add";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
      <section className="space-y-5">
        <div>
          <p className="eyebrow">AI Extraction Result</p>
          <h1 className="mt-2 text-4xl font-black">{study.safe_public_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="tag">{study.analysis_status}</span>
            <span className="tag">{study.portfolio_classification}</span>
            <span className="tag">Portfolio value {study.portfolio_score}/100</span>
          </div>
        </div>

        {quotaBlocked ? (
          <section className="rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm font-semibold leading-6 text-ember">
            {OPENAI_QUOTA_MESSAGE}
          </section>
        ) : null}

        <InfoGrid
          items={[
            ["Platform", study.platform],
            ["Visible study title", study.study_title],
            ["Visible topic", study.visible_topic],
            ["Estimated duration", study.estimated_duration],
            ["Reward/payment", study.reward],
            ["Study type", study.study_type],
            ["Likely task type", study.what_i_did],
            ["Visible approval/payment status", study.approval_status],
            ["Confidentiality risk", study.confidentiality_risk],
            ["AI confidence", `${study.ai_confidence}/100`],
            ["Portfolio value score", `${study.portfolio_score}/100`],
            ["Recommended portfolio section", study.recommended_section]
          ]}
        />

        <section className="card">
          <p className="eyebrow">Public Publish Recommendation</p>
          <p className="mt-3 text-base font-semibold leading-7 text-ink/72 dark:text-paper/72">
            {study.public_publish_recommendation}
          </p>
        </section>

        <section className="card">
          <p className="eyebrow">Safe Public Description</p>
          <p className="mt-3 text-base leading-7 text-ink/72 dark:text-paper/72">
            {study.safe_public_description}
          </p>
        </section>

        <section className="card">
          <p className="eyebrow">Skills Detected</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {study.skills_demonstrated.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">LinkedIn Featured Text</p>
          <h2 className="mt-3 text-xl font-bold">{study.linkedin_featured_title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70 dark:text-paper/70">
            {study.linkedin_featured_description}
          </p>
        </section>

        {study.missing_questions.length ? (
          <section className="card">
            <p className="eyebrow">Missing Questions</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/70 dark:text-paper/70">
              {study.missing_questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

      <aside className="space-y-5">
        <ReviewActions canPublish={canPublish} studyId={study.id} />

        <section className="card">
          <p className="eyebrow">Preview</p>
          <h2 className="mt-3 text-2xl font-black">{study.safe_public_title}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-paper/70">
            {study.safe_public_description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {study.skills_demonstrated.slice(0, 4).map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        {study.screenshot_urls.length ? (
          <section className="card">
            <p className="eyebrow">Private Screenshot Evidence</p>
            <div className="mt-4 grid gap-3">
              {study.screenshot_urls.map((url) => (
                <div className="overflow-hidden rounded-lg border border-ink/10 dark:border-white/10" key={url}>
                  <img
                    src={url}
                    alt="Private screenshot evidence"
                    loading="lazy"
                    className="h-auto w-full object-contain"
                  />
                  <a
                    className="block border-t border-ink/10 p-3 text-sm font-semibold text-cyan dark:border-white/10"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full screenshot
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <section className="card grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="subtle-card" key={label}>
          <p className="text-xs font-bold text-ink/50 dark:text-paper/50">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value || "unknown"}</p>
        </div>
      ))}
    </section>
  );
}

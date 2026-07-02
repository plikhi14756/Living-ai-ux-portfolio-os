import { PublicShell } from "@/components/public/public-shell";

export const metadata = {
  title: "About"
};

export default function AboutPage() {
  const directions = [
    "AI UX Research",
    "HCI",
    "Human-AI Interaction",
    "Fintech UX",
    "Conversational AI",
    "Voice AI",
    "Multilingual Product Evaluation",
    "UX Research Participation",
    "AI Evaluation"
  ];

  return (
    <PublicShell>
      <section className="container-page grid gap-8 py-10 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">About Pranav</p>
          <h1 className="mt-3 text-4xl font-black">AI UX research direction</h1>
        </div>
        <div className="card">
          <p className="text-base leading-8 text-ink/72 dark:text-paper/72">
            Pranav Likhi is building toward a career in AI UX Research and
            Human-AI Interaction, combining customer experience, product
            feedback, multilingual communication, and hands-on participation in
            AI evaluation and usability research studies.
          </p>
          <p className="mt-4 text-base leading-8 text-ink/72 dark:text-paper/72">
            This living portfolio turns study screenshots, notes, and research
            participation evidence into safe public summaries, allowing the
            strongest experiences to surface over time while protecting
            confidentiality.
          </p>
        </div>
      </section>
      <section className="container-page pb-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {directions.map((direction) => (
            <div className="subtle-card font-semibold" key={direction}>
              {direction}
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

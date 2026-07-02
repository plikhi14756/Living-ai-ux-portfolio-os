import { ManualExperienceForm } from "@/components/forms/manual-experience-form";

export const metadata = {
  title: "Manual Experience"
};

export default function AdminManualPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="eyebrow">Manual Experience Agent</p>
        <h1 className="mt-2 text-4xl font-black">Add an experience from memory</h1>
        <p className="mt-4 text-base leading-7 text-ink/70 dark:text-paper/70">
          Use this for research participation, AI evaluation, or product
          feedback experiences that do not have a screenshot. The same
          classification, confidentiality, writing, and approval flow applies.
        </p>
      </section>
      <ManualExperienceForm />
    </div>
  );
}

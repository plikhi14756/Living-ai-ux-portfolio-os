import { notFound } from "next/navigation";
import { EditStudyForm } from "@/components/forms/edit-study-form";
import { getStudy } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Study"
};

export default async function EditStudyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const study = await getStudy(id);
  if (!study) notFound();

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Edit Experience</p>
        <h1 className="mt-2 text-4xl font-black">{study.safe_public_title}</h1>
        <p className="mt-3 text-base leading-7 text-ink/70 dark:text-paper/70">
          Edit the extraction, public copy, classification, LinkedIn text, and
          review fields before publishing or after approval.
        </p>
      </section>
      <EditStudyForm study={study} />
    </div>
  );
}

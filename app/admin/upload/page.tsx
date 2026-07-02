import { UploadStudyForm } from "@/components/forms/upload-study-form";

export const metadata = {
  title: "Upload Study"
};

export default function AdminUploadPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="eyebrow">Screenshot Upload</p>
        <h1 className="mt-2 text-4xl font-black">Upload study evidence</h1>
        <p className="mt-4 text-base leading-7 text-ink/70 dark:text-paper/70">
          Upload one or more screenshots, add optional notes, choose the
          platform if known, and send it through the AI extraction and review
          workflow.
        </p>
      </section>
      <UploadStudyForm />
    </div>
  );
}

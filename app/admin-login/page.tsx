import { Suspense } from "react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata = {
  title: "Admin Login"
};

export default function AdminLoginPage() {
  return (
    <main className="container-page flex min-h-screen items-center justify-center py-10">
      <section className="grid w-full max-w-4xl gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Private Admin</p>
          <h1 className="mt-3 text-4xl font-black">Access Living AI UX Portfolio OS</h1>
          <p className="mt-4 text-base leading-7 text-ink/70 dark:text-paper/70">
            Enter the deployment admin token to review studies, publish entries,
            manage settings, and run monthly review agents.
          </p>
        </div>
        <Suspense fallback={<div className="card">Loading admin access...</div>}>
          <AdminLoginForm />
        </Suspense>
      </section>
    </main>
  );
}

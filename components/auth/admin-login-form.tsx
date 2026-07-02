"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: formData.get("token"),
        next: searchParams.get("next") ?? "/admin"
      })
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    router.push(result.redirectTo ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <label className="block space-y-2">
        <span className="label">Admin access token</span>
        <input
          className="field"
          name="token"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
      <button className="btn-primary" type="submit" disabled={loading}>
        <LockKeyhole size={18} />
        {loading ? "Checking..." : "Enter admin"}
      </button>
    </form>
  );
}

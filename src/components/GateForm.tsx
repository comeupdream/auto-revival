"use client";

import { useState } from "react";

/** Password form for the site-wide lockdown gate (/locked). */
export default function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Incorrect password.");
        return;
      }
      // Unlocked — reload so the middleware lets this URL through.
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div>
        <label className="field-label" htmlFor="gate-password">
          Password
        </label>
        <input
          id="gate-password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-accent/5 px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="btn-accent w-full"
      >
        {loading ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

/**
 * Public "leave a review" form for the Testimonials section. Submissions are
 * held for staff approval before appearing on the site.
 */
export default function TestimonialForm() {
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see it
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, vehicle, rating, text, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-5 font-serif text-2xl">Thank you!</h3>
        <p className="mt-2 text-sm text-muted">
          Your review is in — it&apos;ll appear here once our team approves it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl p-6 sm:p-8">
      <h3 className="font-serif text-2xl">Leave a review</h3>
      <p className="mt-1 text-sm text-muted">
        Had your car in with us? We&apos;d love to hear how it went.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="t-name">
            Name <span className="text-accent">*</span>
          </label>
          <input
            id="t-name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jamie Rivera"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="t-vehicle">
            Vehicle
          </label>
          <input
            id="t-vehicle"
            className="field-input"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="2019 BMW M3"
          />
        </div>
        <div className="sm:col-span-2">
          <span className="field-label">Rating</span>
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Star rating"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                className="p-0.5"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-7 w-7 transition-colors ${
                    n <= (hovered || rating) ? "fill-accent" : "fill-line"
                  }`}
                >
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="t-text">
            Your review <span className="text-accent">*</span>
          </label>
          <textarea
            id="t-text"
            className="field-input min-h-28 resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="They brought my paint back from the dead — looks better than the day I bought it…"
          />
        </div>
        {/* Honeypot — hidden from real visitors, catnip for bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="t-website">Website</label>
          <input
            id="t-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim() || text.trim().length < 10}
        className="btn-accent mt-6 w-full sm:w-auto"
      >
        {submitting ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}

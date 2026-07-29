"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Stars from "@/components/Stars";

type Testimonial = {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
};

export function AdminTestimonials() {
  const router = useRouter();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "live">("all");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.testimonials) ? data.testimonials : []);
    } catch {
      setError("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function setApproved(id: string, approved: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, approved } : t)));
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!res.ok) fetchList();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review? This can't be undone.")) return;
    setItems((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (!res.ok) fetchList();
  }

  const pending = items.filter((t) => !t.approved).length;
  const shown = items.filter((t) =>
    filter === "all" ? true : filter === "pending" ? !t.approved : t.approved,
  );

  return (
    <div className="mt-1">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="font-serif text-xl">Testimonials</h2>
          <p className="mt-0.5 text-xs text-muted">
            {items.length} review{items.length === 1 ? "" : "s"} ·{" "}
            {pending > 0 ? `${pending} awaiting approval` : "all reviewed"}.
            Approved reviews appear in the Testimonials section on the site.
          </p>
        </div>
        <div className="flex rounded-full border border-line p-0.5">
          {(["all", "pending", "live"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-accent text-black" : "text-muted hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">{error}</p>
      )}

      {loading ? (
        <div className="card mt-4 px-4 py-16 text-center text-muted">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="card mt-4 px-4 py-16 text-center">
          <p className="font-serif text-xl">No reviews here</p>
          <p className="mt-1 text-sm text-muted">
            {filter === "pending"
              ? "Nothing waiting on you — nice."
              : "Reviews customers submit on the site will show up here for approval."}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{t.name}</span>
                    <Stars rating={t.rating} />
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                        t.approved
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {t.approved ? "Live" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {t.vehicle && <span>{t.vehicle} · </span>}
                    {new Date(t.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setApproved(t.id, !t.approved)}
                    className="btn-ghost !px-3.5 !py-1.5 text-xs"
                  >
                    {t.approved ? "Hide" : "Approve"}
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-xs text-muted hover:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/90">{t.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

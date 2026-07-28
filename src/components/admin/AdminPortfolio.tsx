"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = {
  id: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
  published: boolean;
  sortOrder: number;
  createdAt: string;
};

const MAX_EDGE = 1600; // longest edge after resize
const JPEG_QUALITY = 0.82;

/** Load a File into an <img> (browsers auto-apply EXIF orientation here). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

function fit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = Math.min(max / w, max / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Resize a photo on the client and return a JPEG data URL. */
async function resizeToDataUrl(file: File) {
  const img = await loadImage(file);
  const { width, height } = fit(img.naturalWidth, img.naturalHeight, MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images here.");
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), width, height };
}

export function AdminPortfolio() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/portfolio");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.images) ? data.images : []);
    } catch {
      setError("Could not load the portfolio.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setError("");
    setUploading({ done: 0, total: list.length });
    const failures: string[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        const { dataUrl, width, height } = await resizeToDataUrl(file);
        const res = await fetch("/api/admin/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, width, height }),
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          failures.push(`${file.name}: ${d.error ?? "upload failed"}`);
        }
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : "failed"}`);
      }
      setUploading({ done: i + 1, total: list.length });
    }

    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
    if (failures.length > 0) setError(failures.join(" · "));
    await fetchList();
  }

  async function saveCaption(id: string, caption: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, caption } : it)));
    await fetch(`/api/admin/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
  }

  async function togglePublished(id: string, published: boolean) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, published } : it)));
    const res = await fetch(`/api/admin/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    if (!res.ok) fetchList();
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    const res = await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    if (!res.ok) fetchList();
  }

  const liveCount = items.filter((i) => i.published).length;

  return (
    <div className="mt-1">
      {/* Action bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="font-serif text-xl">Gallery photos</h2>
          <p className="mt-0.5 text-xs text-muted">
            {items.length} photo{items.length === 1 ? "" : "s"} · {liveCount} live on the site.
            Photos are resized automatically — upload straight from your phone or computer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {uploading && (
            <span className="text-xs text-muted">
              Uploading {uploading.done}/{uploading.total}…
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!!uploading}
            className="btn-accent !px-4 !py-2 text-sm"
          >
            {uploading ? "Uploading…" : "+ Add photos"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">{error}</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="card mt-4 px-4 py-16 text-center text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card mt-4 px-4 py-16 text-center">
          <p className="font-serif text-xl">No photos yet</p>
          <p className="mt-1 text-sm text-muted">
            Click “Add photos” to upload your first shots. They’ll appear on the public
            Portfolio page right away.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.id}
              className={`card overflow-hidden transition-opacity ${it.published ? "" : "opacity-60"}`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/portfolio/${it.id}`}
                  alt={it.alt || it.caption || "Portfolio photo"}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                {!it.published && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-3">
                <input
                  defaultValue={it.caption}
                  placeholder="Add a caption…"
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== it.caption) saveCaption(it.id, v);
                  }}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => togglePublished(it.id, !it.published)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {it.published ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    className="text-xs text-muted hover:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

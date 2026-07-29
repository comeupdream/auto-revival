"use client";

import { useState } from "react";

/**
 * One of the two hero car photos revealed behind the curtain.
 *
 * Looks for the photo in /public/cars under a few friendly names
 * (car-left / car-1 and car-right / car-2, in jpg/jpeg/png/webp). If none
 * exists yet, a gold-framed "coming soon" placeholder renders in the same
 * footprint — drop the photos in and they appear with no code change.
 *
 * The frame fills whatever size the parent gives it (set width/height via
 * `className`); the photo covers the frame.
 */
const EXTS = ["jpg", "jpeg", "png", "webp"];

function candidatesFor(side: "left" | "right"): string[] {
  const names = [`car-${side}`, side === "left" ? "car-1" : "car-2"];
  return names.flatMap((n) => EXTS.map((e) => `/cars/${n}.${e}`));
}

export default function CarPhoto({
  side,
  className = "",
  bare = false,
}: {
  side: "left" | "right";
  className?: string;
  /** Full-bleed mode: no gold frame, rounding, or shadow. */
  bare?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const candidates = candidatesFor(side);
  const exhausted = idx >= candidates.length;

  return (
    <figure className={className}>
      <div
        className={`h-full w-full overflow-hidden ${
          bare
            ? "bg-black"
            : "rounded-xl2 border border-accent/50 bg-surface shadow-[0_24px_70px_rgba(0,0,0,0.7)]"
        }`}
      >
        {exhausted ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <svg
              viewBox="0 0 64 32"
              className="w-16 text-accent/70"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* simple coupe silhouette */}
              <path d="M6 22c-2 0-3-1-3-3 0-1.6.9-2.6 2.6-3l7.9-1.7 6.9-6.1C22.6 6.4 24.5 6 26.4 6h10.4c2.3 0 4.5.8 6.3 2.3l5.4 4.5 8.1 1.6c2 .4 4.4 1.7 4.4 4.1 0 2.3-1.2 3.5-3.3 3.5h-2.2a6 6 0 0 1-11.6 0H21.1a6 6 0 0 1-11.6 0H6Zm9.8-2.5a3.2 3.2 0 1 0 0 .1v-.1Zm34 0a3.2 3.2 0 1 0 0 .1v-.1ZM26 8.6c-1.2 0-2.4.4-3.3 1.2l-5 4.4h12.6V8.6H26Zm6.8 0v5.6h11.7l-4-3.4a7 7 0 0 0-4.4-2.2h-3.3Z" />
            </svg>
            <figcaption className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted">
              Photo coming soon
            </figcaption>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidates[idx]}
            alt={
              side === "left"
                ? "A freshly detailed car at Auto Revival"
                : "Showroom-shine results from Auto Revival"
            }
            onError={() => setIdx((i) => i + 1)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </figure>
  );
}

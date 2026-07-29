"use client";

import { useState } from "react";

/**
 * The company logo.
 *
 * If a real logo file exists in /public/brand (logo.png / .webp / .jpg /
 * .svg — first found wins), it's used as-is. Until one is dropped in, a
 * built-in black & gold lockup renders instead, so the site never shows a
 * broken image.
 */
const LOGO_CANDIDATES = [
  "/brand/logo.png",
  "/brand/logo.webp",
  "/brand/logo.jpg",
  "/brand/logo.svg",
];

export default function BrandLogo({
  variant = "hero",
}: {
  variant?: "hero" | "header";
}) {
  const [idx, setIdx] = useState(0);
  const hero = variant === "hero";

  if (idx < LOGO_CANDIDATES.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={LOGO_CANDIDATES[idx]}
        alt="Auto Revival"
        onError={() => setIdx((i) => i + 1)}
        className={
          hero
            ? "w-[min(44vw,260px)] drop-shadow-[0_10px_44px_rgba(0,0,0,0.85)]"
            : "h-9 w-auto"
        }
      />
    );
  }

  // ---- Built-in lockup (used until a real logo lands in /public/brand) ----
  if (!hero) {
    return (
      <span className="text-gold-gradient font-serif text-lg font-semibold tracking-[0.18em]">
        AUTO REVIVAL
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Double-ring monogram */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/80 p-1 shadow-[0_0_34px_rgba(212,175,55,0.3)] sm:h-16 sm:w-16">
        <div className="flex h-full w-full items-center justify-center rounded-full border border-accent/50">
          <span className="text-gold-gradient font-serif text-lg font-bold sm:text-xl">
            AR
          </span>
        </div>
      </div>

      <div className="text-gold-gradient mt-3 font-serif text-3xl font-bold tracking-[0.12em] sm:text-4xl lg:text-5xl">
        AUTO&nbsp;REVIVAL
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent sm:w-16" />
        <span className="text-[10px] uppercase tracking-[0.42em] text-accent sm:text-xs">
          Premium Auto Detailing
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent sm:w-16" />
      </div>
    </div>
  );
}

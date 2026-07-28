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
            ? "w-[min(66vw,430px)] drop-shadow-[0_0_34px_rgba(212,175,55,0.28)]"
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
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent/80 p-1.5 shadow-[0_0_34px_rgba(212,175,55,0.3)] sm:h-24 sm:w-24">
        <div className="flex h-full w-full items-center justify-center rounded-full border border-accent/50">
          <span className="text-gold-gradient font-serif text-2xl font-bold sm:text-3xl">
            AR
          </span>
        </div>
      </div>

      <div className="text-gold-gradient mt-5 font-serif text-4xl font-bold tracking-[0.12em] sm:text-6xl lg:text-7xl">
        AUTO&nbsp;REVIVAL
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent sm:w-16" />
        <span className="text-[10px] uppercase tracking-[0.42em] text-accent sm:text-xs">
          Premium Auto Detailing
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent sm:w-16" />
      </div>
    </div>
  );
}

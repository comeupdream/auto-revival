"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import BrandLogo from "@/components/BrandLogo";
import CarPhoto from "@/components/CarPhoto";
import { SHOP } from "@/lib/shop-config";

/**
 * The theater-curtain reveal.
 *
 * A black curtain (two fabric panels + a top valance) covers the stage on
 * load. Scrolling down the runway lifts the valance and draws the panels
 * apart, unveiling the gold Auto Revival lockup flanked by the two car
 * photos. All motion is driven by the `--open` CSS custom property
 * (0 = closed → 1 = fully open) set from scroll progress, so nothing
 * re-renders while scrolling.
 *
 * With `prefers-reduced-motion`, the curtain simply rests open.
 */

/** Total scroll runway. The viewport stays pinned while it's consumed. */
const RUNWAY = "220vh";
/** Fraction of the runway that completes the opening — the rest holds the
 *  finished stage for a beat before the page scrolls on. */
const OPEN_BY = 0.82;

export default function CurtainHero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--open", "1");
      return;
    }

    let raf = 0;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
      const raw = total > 0 ? scrolled / total : 1;
      el.style.setProperty("--open", Math.min(raw / OPEN_BY, 1).toFixed(4));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="curtain-root relative"
      style={{ height: RUNWAY, ["--open" as string]: 0 }}
    >
      <h1 className="sr-only">
        {SHOP.name} — Premium Auto Detailing
      </h1>

      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        {/* ------------------------------------------------------- The stage */}
        <div
          className="gold-glow absolute inset-0"
          style={{
            opacity: "calc(0.3 + var(--open) * 0.7)",
            transform: "scale(calc(0.95 + var(--open) * 0.05))",
          }}
        >
          <div className="mx-auto flex h-full w-full max-w-[1750px] flex-col items-center justify-center gap-5 px-3 pt-16 sm:gap-7 sm:px-6">
            <BrandLogo variant="hero" />

            {/* The two hero cars, side by side, carrying the stage. */}
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-6">
              <CarPhoto
                side="left"
                className="h-[24vh] w-full sm:h-[36vh] lg:h-[46vh]"
              />
              <CarPhoto
                side="right"
                className="h-[24vh] w-full sm:h-[36vh] lg:h-[46vh]"
              />
            </div>

            <p className="hidden max-w-xl text-balance text-center text-lg leading-relaxed text-muted md:block">
              {SHOP.tagline}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/book" className="btn-accent !px-8 !py-3.5 text-base">
                Book a detail
              </Link>
              <Link href="/#services" className="btn-ghost !px-8 !py-3.5 text-base">
                Services &amp; pricing
              </Link>
            </div>
          </div>
        </div>

        {/* --------------------------------------------- Left curtain panel */}
        <div
          aria-hidden="true"
          className="curtain-fabric absolute inset-y-0 left-0 z-20 w-[52%] will-change-transform"
          style={{ transform: "translateX(calc(var(--open) * -108%))" }}
        >
          <div className="curtain-braid absolute inset-y-0 right-0 w-[3px]" />
        </div>

        {/* -------------------------------------------- Right curtain panel */}
        <div
          aria-hidden="true"
          className="curtain-fabric absolute inset-y-0 right-0 z-20 w-[52%] will-change-transform"
          style={{ transform: "translateX(calc(var(--open) * 108%)) scaleX(-1)" }}
        >
          <div className="curtain-braid absolute inset-y-0 right-0 w-[3px]" />
        </div>

        {/* -------------------------------------------------- Valance (top) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-30 will-change-transform"
          style={{ transform: "translateY(calc(var(--open) * -135%))" }}
        >
          <div className="curtain-fabric h-[12vh] min-h-[70px]" />
          <div className="curtain-braid h-[3px]" />
          <div className="curtain-fringe h-[24px]" />
        </div>

        {/* ------------------------------------------------------ Scroll hint */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-8 z-40 flex flex-col items-center gap-2 text-accent"
          style={{ opacity: "clamp(0, calc(1 - var(--open) * 6), 1)" }}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.42em]">
            Scroll to unveil
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}

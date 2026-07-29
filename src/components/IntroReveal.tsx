"use client";

import { useEffect, useState } from "react";
import { RD_PATH, RD_VIEWBOX } from "@/components/rd-path";

/**
 * First-load intro: a point of gold light traces the outlines of the real RD
 * monogram (vectorized from the emblem artwork), the letters flood with
 * metallic gold, a sheen sweeps across, the wordmark rises — then the whole
 * thing dissolves into the homepage.
 *
 * Plays once per browser session (sessionStorage), skips entirely for
 * prefers-reduced-motion, and any click (or the Skip button) dismisses it.
 */
const SEEN_KEY = "rd-intro-seen";
const AUTO_LEAVE_MS = 3200;
const FADE_MS = 750;

export default function IntroReveal() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) {
        setPhase("gone");
        return;
      }
    } catch {
      /* storage unavailable — just play */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markSeen();
      setPhase("gone");
      return;
    }
    const t = window.setTimeout(leave, AUTO_LEAVE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scrolling while the intro is on screen.
  useEffect(() => {
    if (phase === "gone") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  function markSeen() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function leave() {
    markSeen();
    setPhase((p) => {
      if (p !== "show") return p;
      window.setTimeout(() => setPhase("gone"), FADE_MS);
      return "leaving";
    });
  }

  if (phase === "gone") return null;

  return (
    <div
      onClick={leave}
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-black transition-all duration-700 ease-out ${
        phase === "leaving" ? "scale-[1.05] opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes introDraw { to { stroke-dashoffset: 0; } }
        @keyframes introFill { to { opacity: 1; } }
        @keyframes introSheen {
          from { transform: translateX(0) skewX(-18deg); }
          to { transform: translateX(1500px) skewX(-18deg); }
        }
        @keyframes introWord {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes introBloom {
          0%, 55% { opacity: 0; }
          78% { opacity: 1; }
          100% { opacity: 0.65; }
        }
        .intro-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: introDraw 1.8s cubic-bezier(0.65, 0, 0.35, 1) 0.15s forwards;
        }
        .intro-fill { opacity: 0; animation: introFill 0.6s ease-out 1.6s forwards; }
        .intro-sheen { animation: introSheen 0.9s cubic-bezier(0.4, 0, 0.2, 1) 2.1s forwards; }
        .intro-word { opacity: 0; animation: introWord 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.95s forwards; }
        .intro-bloom { opacity: 0; animation: introBloom 2.7s ease forwards; }
      `}</style>

      {/* Gold bloom behind the monogram as the fill lands. */}
      <div className="gold-glow intro-bloom pointer-events-none absolute inset-0" />

      <svg viewBox={RD_VIEWBOX} className="w-[min(58vw,320px)]">
        <defs>
          <linearGradient id="rdGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7e7a9" />
            <stop offset="0.45" stopColor="#d4af37" />
            <stop offset="0.75" stopColor="#8f6f1f" />
            <stop offset="1" stopColor="#e6c55a" />
          </linearGradient>
          <clipPath id="rdClip">
            <path d={RD_PATH} fillRule="evenodd" />
          </clipPath>
        </defs>

        {/* soft glow under-trace */}
        <path
          d={RD_PATH}
          pathLength={1}
          fill="none"
          stroke="#d4af37"
          strokeWidth={7}
          opacity={0.35}
          style={{ filter: "blur(6px)" }}
          className="intro-draw"
        />
        {/* crisp gold trace */}
        <path
          d={RD_PATH}
          pathLength={1}
          fill="none"
          stroke="url(#rdGold)"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="intro-draw"
        />
        {/* the letters flood with gold */}
        <path d={RD_PATH} fill="url(#rdGold)" fillRule="evenodd" className="intro-fill" />
        {/* sheen sweep across the finished letters */}
        <g clipPath="url(#rdClip)">
          <rect
            x={-420}
            y={-100}
            width={240}
            height={1000}
            fill="#ffffff"
            opacity={0.32}
            className="intro-sheen"
          />
        </g>
      </svg>

      <div className="intro-word text-gold-gradient mt-9 font-serif text-2xl font-semibold tracking-[0.3em] sm:text-3xl">
        REVIVE&nbsp;DETAIL
      </div>
      <div className="intro-word mt-3 text-[10px] uppercase tracking-[0.42em] text-accent/90">
        Mobile Car Detailing
      </div>

      <button
        onClick={leave}
        className="absolute right-5 top-5 text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-accent"
      >
        Skip →
      </button>
    </div>
  );
}

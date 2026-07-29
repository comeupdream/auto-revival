import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Marcellus,
  Playfair_Display,
} from "next/font/google";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Font tryouts",
  robots: { index: false, follow: false },
};

// The five heading-font candidates, loaded only on this page.
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"] });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] });

const CANDIDATES = [
  {
    name: "Bodoni Moda",
    className: bodoni.className,
    note: "High-contrast didone — the luxury fashion-masthead look. Classical bones, razor-sharp modern edge.",
    live: true,
  },
  {
    name: "Playfair Display",
    className: playfair.className,
    note: "Elegant transitional serif. Beautiful, but widely used on template sites.",
    live: false,
  },
  {
    name: "Cormorant Garamond",
    className: cormorant.className,
    note: "Romantic renaissance serif. Softer and more delicate — less automotive.",
    live: false,
  },
  {
    name: "Marcellus",
    className: marcellus.className,
    note: "Roman inscriptional capitals. Refined and quiet, but only one weight.",
    live: false,
  },
  {
    name: "Cinzel",
    className: cinzel.className,
    note: "Engraved Trajan-style caps — the previous font. Classic movie-poster energy.",
    live: false,
  },
];

export default async function FontTryoutsPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-bg pb-20">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="font-serif text-2xl leading-none">Font tryouts</h1>
            <p className="mt-1 text-xs text-muted">
              Heading-font candidates rendered with real site copy. The one
              marked LIVE is what the site uses now — to switch, just say the
              name.
            </p>
          </div>
          <Link href="/admin" className="btn-ghost !px-4 !py-2 text-sm">
            ← Job book
          </Link>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-5xl space-y-6 px-5">
        {CANDIDATES.map((f) => (
          <section key={f.name} className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg/60 px-6 py-3">
              <div className="flex items-center gap-3">
                <h2 className="font-sans text-sm font-semibold tracking-wide">
                  {f.name}
                </h2>
                {f.live && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-accent">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{f.note}</p>
            </div>

            <div className={`${f.className} space-y-5 px-6 py-8`}>
              <div className="text-gold-gradient text-4xl font-bold tracking-[0.12em] sm:text-5xl">
                AUTO&nbsp;REVIVAL
              </div>
              <div className="text-3xl">Showroom shine, brought back to life.</div>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                <span className="text-2xl text-accent">Services &amp; Pricing</span>
                <span className="text-xl">Book your detail</span>
                <span className="text-sm uppercase tracking-[0.22em] text-ink/80">
                  Services · Our Work · Visit
                </span>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

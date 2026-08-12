import type { Metadata } from "next";
import BrandLogo from "@/components/BrandLogo";
import GateForm from "@/components/GateForm";

export const metadata: Metadata = {
  title: "Locked",
  robots: { index: false, follow: false },
};

/**
 * The lockdown gate. While the site is sealed, src/middleware.ts rewrites
 * every page URL here.
 */
export default function LockedPage() {
  return (
    <main className="brushed flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm py-14">
        <div className="flex justify-center">
          <BrandLogo variant="header" />
        </div>

        <div className="card mt-8 p-7">
          <p className="eyebrow">Private for now</p>
          <h1 className="mt-2 text-2xl">The curtain is down</h1>
          <p className="mt-2 text-sm text-muted">
            We&rsquo;re polishing things up behind it. If you have the
            password, come on in.
          </p>
          <GateForm />
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-muted">
          Revive Detail
        </p>
      </div>
    </main>
  );
}

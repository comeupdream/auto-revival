import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { SHOP } from "@/lib/shop-config";

/**
 * Public site header. `overlay` floats it above the curtain hero on the home
 * page; on other pages it sits on a solid sticky bar.
 */
export default function SiteHeader({
  overlay = false,
}: {
  overlay?: boolean;
}) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-50"
          : "sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur"
      }
    >
      <div className="container-page flex h-20 items-center justify-between">
        <Link href="/" className="flex flex-col leading-none">
          <BrandLogo variant="header" />
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted">
            Auto Detailing
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.22em] text-ink/80 md:flex">
          <Link href="/#services" className="transition-colors hover:text-accent">
            Services
          </Link>
          <Link href="/portfolio" className="transition-colors hover:text-accent">
            Our Work
          </Link>
          <Link href="/#visit" className="transition-colors hover:text-accent">
            Visit
          </Link>
          <a
            href={`tel:${SHOP.phone.replace(/[^\d+]/g, "")}`}
            className="tracking-[0.08em] transition-colors hover:text-accent"
          >
            {SHOP.phone}
          </a>
        </nav>

        <Link href="/book" className="btn-accent !px-5 !py-2.5">
          Book now
        </Link>
      </div>
    </header>
  );
}

import Link from "next/link";
import { SHOP, hoursForDisplay } from "@/lib/shop-config";

export default function SiteFooter() {
  const hours = hoursForDisplay();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <div className="container-page relative z-20 grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="text-gold-gradient font-serif text-2xl font-semibold tracking-[0.14em]">
            REVIVE DETAIL
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {SHOP.tagline}
          </p>
          <Link href="/book" className="btn-accent mt-6 !px-5 !py-2.5">
            Book a detail
          </Link>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide">Visit</h3>
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-muted">
            <div>{SHOP.address}</div>
            <div>{SHOP.cityLine}</div>
            <div className="pt-2">
              <a className="hover:text-accent" href={`tel:${SHOP.phone.replace(/[^\d+]/g, "")}`}>
                {SHOP.phone}
              </a>
            </div>
            <div>
              <a className="hover:text-accent" href={`mailto:${SHOP.email}`}>
                {SHOP.email}
              </a>
            </div>
            <div className="pt-2">
              <a
                className="hover:text-accent"
                href={SHOP.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow us on Facebook
              </a>
            </div>
          </address>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide">Hours</h3>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.day.slice(0, 3)}</span>
                <span className={h.hours === "Closed" ? "text-muted/60" : ""}>
                  {h.hours}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {SHOP.name}. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/portfolio" className="hover:text-accent">
              Our Work
            </Link>
            <Link href="/admin" className="hover:text-accent">
              Staff sign-in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

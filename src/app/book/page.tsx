import type { Metadata } from "next";
import Link from "next/link";
import BookingForm, { type BookingService } from "@/components/BookingForm";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { SHOP, shopTodayISO } from "@/lib/shop-config";
import { addDaysISO, weekdayOf } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a detail",
};

/** The next `n` open dates, starting today, as ISO strings. */
function nextOpenDates(n: number): string[] {
  const out: string[] = [];
  let cursor = shopTodayISO();
  let guard = 0;
  while (out.length < n && guard < 90) {
    if (SHOP.hours[weekdayOf(cursor)]) out.push(cursor);
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return out;
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const sp = await searchParams;
  const initialServiceId = typeof sp.service === "string" ? sp.service : "";

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const list: BookingService[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    category: s.category,
  }));

  const minDate = shopTodayISO();
  const maxDate = addDaysISO(minDate, SHOP.bookingHorizonDays);
  const quickDates = nextOpenDates(6);

  return (
    <div className="brushed flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="container-page flex h-20 items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-gold-gradient font-serif text-lg font-semibold tracking-[0.14em]">
              REVIVE DETAIL
            </span>
            <span className="mt-0.5 text-[11px] uppercase tracking-[0.28em] text-muted">
              Book online
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-accent">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="container-page w-full max-w-3xl flex-1 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <p className="eyebrow">Online booking</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Book your detail</h1>
          <p className="mt-3 text-muted">
            Tell us about your vehicle, pick a service priced for it, and
            choose a time — done in about a minute.
          </p>
        </div>

        <BookingForm
          services={list}
          minDate={minDate}
          maxDate={maxDate}
          quickDates={quickDates}
          initialServiceId={initialServiceId}
        />
      </main>

      <SiteFooter />
    </div>
  );
}

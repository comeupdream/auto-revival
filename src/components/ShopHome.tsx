import Link from "next/link";
import CurtainHero from "@/components/CurtainHero";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Stars from "@/components/Stars";
import TestimonialForm from "@/components/TestimonialForm";
import { formatDuration, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SHOP, hoursForDisplay } from "@/lib/shop-config";
import { ADD_ONS, DETAIL_PRICES } from "@/lib/vehicle";

type ServiceCard = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

async function getServicesByCategory(): Promise<[string, ServiceCard[]][]> {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const groups = new Map<string, ServiceCard[]>();
  for (const s of services) {
    if (!groups.has(s.category)) groups.set(s.category, []);
    groups.get(s.category)!.push({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      category: s.category,
    });
  }
  return Array.from(groups.entries());
}

/** The full landing page: curtain reveal, services, standards, gallery,
 *  testimonials, and visit info. */
export async function ShopHome() {
  const [categories, photos, testimonials] = await Promise.all([
    getServicesByCategory(),
    prisma.portfolioImage.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, caption: true, alt: true },
    }),
    prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: { id: true, name: true, vehicle: true, rating: true, text: true },
    }),
  ]);
  const hours = hoursForDisplay();

  return (
    <>
      <SiteHeader overlay />

      {/* Curtain hero — opens as the visitor scrolls. */}
      <CurtainHero />

      {/* ------------------------------------------------------------ Services */}
      <section id="services" className="brushed relative overflow-hidden border-t border-line">
        <div className="container-page relative z-20 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The menu</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Services &amp; Pricing</h2>
            <p className="mt-4 text-muted">
              We&apos;re a mobile detailer — we come to you. The Full Detail
              is priced by vehicle type, and every job starts with a
              walk-around so there are no surprises.
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {categories.map(([category, items]) => (
              <div
                key={category}
                className="grid gap-x-12 gap-y-6 lg:grid-cols-[220px_1fr]"
              >
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <h3 className="font-serif text-3xl text-accent">{category}</h3>
                  <div className="mt-2 h-px w-16 bg-accent/40" />
                </div>
                <div className="divide-y divide-line">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-baseline justify-between gap-6 py-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <h4 className="font-serif text-xl">{s.name}</h4>
                          <span className="text-xs uppercase tracking-wider text-muted">
                            {formatDuration(s.durationMinutes)}
                          </span>
                        </div>
                        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                          {s.description}
                        </p>
                        {s.id === "full-detail" && (
                          <p className="mt-2 text-sm tabular-nums text-accent">
                            Coupe/Sedan {formatPrice(DETAIL_PRICES.sedan)} · SUV{" "}
                            {formatPrice(DETAIL_PRICES.suv)} · Truck{" "}
                            {formatPrice(DETAIL_PRICES.truck)} · Minivan{" "}
                            {formatPrice(DETAIL_PRICES.minivan)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-medium tabular-nums text-ink">
                          {s.id === "full-detail" && (
                            <span className="mr-1 text-xs font-normal text-muted">from</span>
                          )}
                          {formatPrice(s.priceCents)}
                        </span>
                        <Link
                          href={`/book?service=${s.id}`}
                          className="text-xs font-medium text-accent transition-opacity hover:underline lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          Book →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add-ons (attached to any detail, not booked alone) */}
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[220px_1fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h3 className="font-serif text-3xl text-accent">Add-Ons</h3>
                <div className="mt-2 h-px w-16 bg-accent/40" />
                <p className="mt-3 text-sm text-muted">Added to any detail.</p>
              </div>
              <div className="divide-y divide-line">
                {ADD_ONS.map((a) => (
                  <div key={a.id} className="flex items-baseline justify-between gap-6 py-5">
                    <div className="min-w-0">
                      <h4 className="font-serif text-xl">{a.name}</h4>
                      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                        {a.description}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-ink">
                      +{formatPrice(a.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-3xl rounded-xl2 border border-accent/20 bg-accent/5 px-6 py-5 text-center text-sm leading-relaxed text-muted">
            <span className="font-semibold text-accent">A kind note:</span>{" "}
            if an interior needs extra love — deep-set stains, heavy trash, or
            the aftermath of kids or pets — an additional fee may apply for
            the extra time and product. We&apos;ll always look the vehicle
            over with you and agree on any adjustment before we start. And
            since we come to you, please have a water supply (an outdoor
            spigot) we can use on site.
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- The standard band */}
      <section className="relative overflow-hidden border-t border-line bg-black">
        <div className="container-page relative z-20 grid gap-12 py-20 sm:py-28 lg:grid-cols-3">
          {[
            {
              t: "Paint-safe, always",
              d: "Two-bucket hand washes, fresh microfiber for every panel, and pH-balanced chemicals. Your clear coat is treated like it's ours.",
            },
            {
              t: "Detailed, not just cleaned",
              d: "Steam, brushes, and patience get into the vents, seams, and seams-within-seams a drive-through will never touch.",
            },
            {
              t: "Booked around your day",
              d: "Transparent pricing and easy online booking. Drop the car, get a text when it's gleaming.",
            },
          ].map((f) => (
            <div key={f.t}>
              <div className="mb-4 h-px w-12 bg-accent" />
              <h3 className="font-serif text-2xl">{f.t}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Our Work */}
      {photos.length > 0 && (
        <section id="work" className="relative overflow-hidden border-t border-line bg-bg">
          <div className="container-page py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Fresh out of the bay</p>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Our Work</h2>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {photos.map((img) => (
                <Link
                  key={img.id}
                  href="/portfolio"
                  className="group overflow-hidden rounded-xl2 border border-line bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/portfolio/${img.id}`}
                    alt={img.alt || img.caption || `Detail by ${SHOP.name}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/portfolio" className="btn-ghost !px-8 !py-3">
                See all our work →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- Testimonials */}
      <section id="testimonials" className="brushed relative overflow-hidden border-t border-line">
        <div className="container-page py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Testimonials</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
              What our clients say
            </h2>
          </div>

          {testimonials.length === 0 ? (
            <p className="mx-auto mt-8 max-w-md text-center text-muted">
              Fresh reviews are on the way — be the first to leave one below.
            </p>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card flex flex-col p-6">
                  <Stars rating={t.rating} />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/90">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-line pt-4">
                    <div className="font-medium">{t.name}</div>
                    {t.vehicle && (
                      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted">
                        {t.vehicle}
                      </div>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="mt-14">
            <TestimonialForm />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Visit */}
      <section id="visit" className="brushed relative overflow-hidden border-t border-line">
        <div className="container-page relative z-20 grid gap-12 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Come see us</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Visit the shop</h2>
            <p className="mt-4 max-w-md text-muted">
              Easy drop-off, comfortable waiting area, and a team that loves
              talking cars. New clients are always welcome.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div>
                <div className="text-muted">Address</div>
                <div className="font-medium">
                  {SHOP.address}, {SHOP.cityLine}
                </div>
              </div>
              <div>
                <div className="text-muted">Phone</div>
                <a
                  className="font-medium hover:text-accent"
                  href={`tel:${SHOP.phone.replace(/[^\d+]/g, "")}`}
                >
                  {SHOP.phone}
                </a>
              </div>
              <div>
                <div className="text-muted">Email</div>
                <a className="font-medium hover:text-accent" href={`mailto:${SHOP.email}`}>
                  {SHOP.email}
                </a>
              </div>
              <div>
                <div className="text-muted">Facebook</div>
                <a
                  className="font-medium hover:text-accent"
                  href={SHOP.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Auto Revival on Facebook
                </a>
              </div>
            </div>
            <Link href="/book" className="btn-accent mt-9 !px-8 !py-3.5">
              Book your detail
            </Link>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line bg-bg px-6 py-4">
              <h3 className="font-serif text-2xl">Hours</h3>
            </div>
            <ul className="divide-y divide-line">
              {hours.map((h) => (
                <li
                  key={h.day}
                  className="flex items-center justify-between px-6 py-3.5 text-sm"
                >
                  <span className="font-medium">{h.day}</span>
                  <span className={h.hours === "Closed" ? "text-muted/60" : "text-muted"}>
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

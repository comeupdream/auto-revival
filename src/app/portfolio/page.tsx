import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";
import { SHOP } from "@/lib/shop-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description: `Recent details from ${SHOP.name} — real cars, real before & afters.`,
  openGraph: {
    title: `Our Work · ${SHOP.name}`,
    description: `Recent details from ${SHOP.name} — real cars, real before & afters.`,
  },
};

export default async function PortfolioPage() {
  const images = await prisma.portfolioImage.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, caption: true, alt: true, width: true, height: true },
  });

  return (
    <>
      <SiteHeader />

      {/* Heading band */}
      <section className="brushed relative overflow-hidden border-b border-line">
        <div className="container-page relative z-20 py-16 text-center sm:py-20">
          <p className="eyebrow">Before &amp; after</p>
          <h1 className="mt-2 font-serif text-5xl sm:text-6xl">Our Work</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            A look at recent details straight out of the bay — corrections,
            coatings, and interiors brought back to life.
          </p>
          <Link href="/book" className="btn-accent mt-8 !px-8 !py-3.5">
            Book your detail
          </Link>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-bg">
        <div className="container-page py-14 sm:py-20">
          {images.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl2 border border-dashed border-line bg-surface/60 px-6 py-20 text-center">
              <p className="font-serif text-2xl">Coming soon</p>
              <p className="mt-2 text-sm text-muted">
                Fresh work is on the way. In the meantime, follow along on{" "}
                <a
                  href={SHOP.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Facebook
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {images.map((img) => (
                <figure
                  key={img.id}
                  className="group break-inside-avoid overflow-hidden rounded-xl2 border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/portfolio/${img.id}`}
                    alt={img.alt || img.caption || `Detail by ${SHOP.name}`}
                    loading="lazy"
                    className="w-full"
                    style={{
                      aspectRatio:
                        img.width && img.height ? `${img.width} / ${img.height}` : undefined,
                    }}
                  />
                  {img.caption && (
                    <figcaption className="px-3.5 py-2.5 text-sm text-muted">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/testimonials — approved reviews, newest first. */
export async function GET() {
  const testimonials = await prisma.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, vehicle: true, rating: true, text: true, createdAt: true },
  });
  return NextResponse.json({ testimonials });
}

/** POST /api/testimonials — public review submission (pending approval). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field. Pretend success so
  // bots move on.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const vehicle = String(body.vehicle ?? "").trim().slice(0, 60);
  const text = String(body.text ?? "").trim();
  const rating = Math.round(Number(body.rating));

  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json(
      { error: "Please write at least a sentence or two." },
      { status: 400 },
    );
  }
  if (text.length > 1200) {
    return NextResponse.json(
      { error: "That's a bit long — 1200 characters max." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a star rating." }, { status: 400 });
  }

  await prisma.testimonial.create({
    data: { name, vehicle, rating, text: text.slice(0, 1200), approved: false },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

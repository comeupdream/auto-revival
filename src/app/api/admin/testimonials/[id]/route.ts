import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/testimonials/:id — approve / hide a review. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { approved: body.approved },
    });
    return NextResponse.json({ ok: true, testimonial });
  } catch {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
}

/** DELETE /api/admin/testimonials/:id — remove a review. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
}

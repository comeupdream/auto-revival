import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/portfolio/:id — edit caption / alt / visibility / order. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Prisma.PortfolioImageUpdateInput = {};
  if (typeof body.caption === "string") data.caption = body.caption.trim().slice(0, 280);
  if (typeof body.alt === "string") data.alt = body.alt.trim().slice(0, 280);
  if (typeof body.published === "boolean") data.published = body.published;
  if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
    data.sortOrder = Math.round(Number(body.sortOrder));
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const image = await prisma.portfolioImage.update({
      where: { id },
      data,
      select: {
        id: true,
        caption: true,
        alt: true,
        published: true,
        sortOrder: true,
      },
    });
    return NextResponse.json({ ok: true, image });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}

/** DELETE /api/admin/portfolio/:id — remove a photo. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.portfolioImage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}

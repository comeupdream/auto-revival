import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { parseImageDataUrl } from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/portfolio — all images (published + hidden), metadata only. */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const images = await prisma.portfolioImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      caption: true,
      alt: true,
      width: true,
      height: true,
      published: true,
      sortOrder: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ images });
}

/** POST /api/admin/portfolio — add a photo (resized data URL from the client). */
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseImageDataUrl(body.dataUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid or too-large image. Use a JPG, PNG, or WebP." },
      { status: 400 },
    );
  }

  const width = Number(body.width);
  const height = Number(body.height);

  const image = await prisma.portfolioImage.create({
    data: {
      data: new Uint8Array(parsed.buffer),
      mimeType: parsed.mimeType,
      caption: typeof body.caption === "string" ? body.caption.trim().slice(0, 280) : "",
      alt: typeof body.alt === "string" ? body.alt.trim().slice(0, 280) : "",
      width: Number.isFinite(width) ? Math.max(0, Math.round(width)) : 0,
      height: Number.isFinite(height) ? Math.max(0, Math.round(height)) : 0,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: image.id }, { status: 201 });
}

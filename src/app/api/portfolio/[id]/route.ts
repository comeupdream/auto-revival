import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/portfolio/:id — serve the raw image bytes. Public. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const image = await prisma.portfolioImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Bytes for a given id never change (edits only touch metadata), so this is
  // safe to cache aggressively.
  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

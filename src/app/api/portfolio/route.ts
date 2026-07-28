import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/portfolio — published gallery images (metadata only, no bytes). */
export async function GET() {
  const images = await prisma.portfolioImage.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, caption: true, alt: true, width: true, height: true },
  });
  return NextResponse.json({ images });
}

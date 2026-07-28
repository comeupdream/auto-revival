import { NextResponse } from "next/server";
import { computeAvailableSlots } from "@/lib/availability";
import { getBusyBlocks } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { isValidDateISO } from "@/lib/time";

export const dynamic = "force-dynamic";

/** GET /api/availability?date=YYYY-MM-DD&serviceId=... — open start times. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";

  if (!isValidDateISO(date)) {
    return NextResponse.json({ error: "Invalid or missing date." }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) {
    return NextResponse.json({ error: "Invalid service." }, { status: 400 });
  }

  const busy = await getBusyBlocks(date);
  const slots = computeAvailableSlots(date, service.durationMinutes, busy);

  return NextResponse.json({
    date,
    serviceId,
    durationMinutes: service.durationMinutes,
    slots,
  });
}

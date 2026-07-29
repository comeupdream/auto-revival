import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAuthed } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/appointments — filtered list for the spreadsheet. */
export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.AppointmentWhereInput = {};
  if (from || to) {
    const dateFilter: Prisma.StringFilter = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.date = dateFilter;
  }
  if (status && status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
      { customerPhone: { contains: q } },
      { vehicle: { contains: q } },
      { serviceName: { contains: q } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ appointments });
}

/** POST /api/admin/appointments — staff-created (walk-in / phone) booking. */
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createBooking({
    serviceId: String(body.serviceId ?? ""),
    date: String(body.date ?? ""),
    startTime: String(body.startTime ?? ""),
    customerName: String(body.customerName ?? ""),
    customerEmail: body.customerEmail ? String(body.customerEmail) : "",
    customerPhone: body.customerPhone ? String(body.customerPhone) : "",
    vehicle: body.vehicle ? String(body.vehicle) : "",
    serviceAddress: body.serviceAddress ? String(body.serviceAddress) : "",
    notes: body.notes ? String(body.notes) : "",
    source: "admin",
    bypassWindowChecks: true,
    // Staff booked this, so send the client their confirmation but skip the
    // owner self-alert.
    notify: { client: true, owner: false },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json(
    { ok: true, appointmentId: result.appointmentId },
    { status: 201 },
  );
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { type AppointmentStatus, isAppointmentStatus } from "@/lib/appointment-status";
import { isAdminAuthed } from "@/lib/auth";
import { ownerEmail, sendEmail } from "@/lib/email";
import { clientCancellation } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { isValidDateISO, isValidTime } from "@/lib/time";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/appointments/:id — update status or details. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Prisma.AppointmentUpdateInput = {};

  let newStatus: AppointmentStatus | undefined;
  if (body.status !== undefined) {
    if (!isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    newStatus = body.status;
    data.status = newStatus;
  }
  if (body.customerName !== undefined) data.customerName = String(body.customerName);
  if (body.customerEmail !== undefined) data.customerEmail = String(body.customerEmail);
  if (body.customerPhone !== undefined) data.customerPhone = String(body.customerPhone);
  if (body.vehicle !== undefined) data.vehicle = String(body.vehicle);
  if (body.notes !== undefined) data.notes = String(body.notes);
  if (body.date !== undefined) {
    if (!isValidDateISO(String(body.date)))
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    data.date = String(body.date);
  }
  if (body.startTime !== undefined) {
    if (!isValidTime(String(body.startTime)))
      return NextResponse.json({ error: "Invalid time." }, { status: 400 });
    data.startTime = String(body.startTime);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // To email the client only on a real transition into CANCELLED, check the
  // prior status before updating.
  let wasCancelled = false;
  if (newStatus === "CANCELLED") {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }
    wasCancelled = existing.status === "CANCELLED";
  }

  try {
    const appointment = await prisma.appointment.update({ where: { id }, data });

    if (newStatus === "CANCELLED" && !wasCancelled && appointment.customerEmail) {
      await sendEmail({
        to: appointment.customerEmail,
        replyTo: ownerEmail(),
        ...clientCancellation(appointment),
      });
    }

    return NextResponse.json({ ok: true, appointment });
  } catch {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }
}

/** DELETE /api/admin/appointments/:id — remove an appointment. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }
}

import { PrismaClient } from "@prisma/client";
import { SHOP } from "../src/lib/shop-config";
import { DETAIL_PRICES } from "../src/lib/vehicle";
import { PERSONAL_BLOCKS } from "./blocks";

const prisma = new PrismaClient();

/**
 * Main services menu. `id` is a stable slug so re-seeding is idempotent.
 * The Full Detail's stored price is the coupe/sedan rate — the booking
 * engine swaps in the SUV / truck / minivan price from DETAIL_PRICES based
 * on the customer's vehicle. Add-ons (clay bar, engine bay) live in
 * src/lib/vehicle.ts, not here — they attach to a booking rather than being
 * booked alone.
 */
const SERVICES = [
  {
    id: "full-detail",
    name: "Full Detail (Interior + Exterior)",
    description:
      "Our complete base detail — full interior clean-out, vacuum, and wipe-down plus exterior hand wash, wheels, tires, and windows. Priced by vehicle type.",
    durationMinutes: 180,
    priceCents: DETAIL_PRICES.sedan,
    category: "Detail Package",
  },
  {
    id: "polish-1",
    name: "One-Step Paint Correction",
    description:
      "A single machine-polish pass that removes most swirls and light scratches for a deep gloss.",
    durationMinutes: 360,
    priceCents: 39900,
    category: "Paint Correction",
  },
  {
    id: "polish-2",
    name: "Two-Step Paint Correction",
    description:
      "Compound then polish for maximum defect removal — the closest thing to new paint.",
    durationMinutes: 360,
    priceCents: 49900,
    category: "Paint Correction",
  },
];

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function main() {
  for (const [i, s] of SERVICES.entries()) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { ...s, sortOrder: i, active: true },
      create: { ...s, sortOrder: i, active: true },
    });
  }
  // Retire anything not on the current menu (e.g. from an older seed).
  await prisma.service.updateMany({
    where: { id: { notIn: SERVICES.map((s) => s.id) } },
    data: { active: false },
  });
  console.log(`Seeded ${SERVICES.length} services.`);

  // One-time cleanup: remove any demo/sample appointments an earlier seed
  // created (fake names with (555) phone numbers). Real bookings never match.
  const removedDemo = await prisma.appointment.deleteMany({
    where: {
      customerName: {
        in: ["Marcus Webb", "Dana Whitfield", "Priya Nair", "Sofia Romano", "Grant Bennett", "Ava Mitchell", "Daniel Cho", "Grace Bennett"],
      },
      customerPhone: { startsWith: "(555)" },
      customerEmail: "",
    },
  });
  if (removedDemo.count > 0) {
    console.log(`Removed ${removedDemo.count} old demo appointments.`);
  }

  // Personal blocked time (prisma/blocks.ts) — bare date/time entries, no
  // price or customer info. Upserted so already-imported rows are stripped
  // down too.
  const today = todayISO();
  const upcomingBlocks = PERSONAL_BLOCKS.filter((b) => b.date >= today);
  for (const b of upcomingBlocks) {
    const data = {
      serviceName: "Blocked",
      durationMinutes: b.minutes,
      priceCents: 0,
      date: b.date,
      startTime: b.time,
      customerName: "",
      status: "CONFIRMED",
      source: "admin",
    };
    await prisma.appointment.upsert({
      where: { id: `block-${b.date}-${b.time.replace(":", "")}` },
      update: data,
      create: { id: `block-${b.date}-${b.time.replace(":", "")}`, ...data },
    });
  }
  if (upcomingBlocks.length > 0) {
    console.log(`Synced ${upcomingBlocks.length} personal blocks.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

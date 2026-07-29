import { PrismaClient } from "@prisma/client";
import { SHOP } from "../src/lib/shop-config";
import { DETAIL_PRICES } from "../src/lib/vehicle";

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

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** The next `count` open dates starting tomorrow. */
function nextOpenDays(count: number): string[] {
  const out: string[] = [];
  let cursor = todayISO();
  let guard = 0;
  while (out.length < count && guard < 30) {
    cursor = addDays(cursor, 1);
    if (SHOP.hours[weekday(cursor)]) out.push(cursor);
    guard++;
  }
  return out;
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

  const count = await prisma.appointment.count();
  if (count > 0) {
    console.log(`Skipped demo appointments (${count} already exist).`);
    return;
  }

  const byId = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const days = nextOpenDays(3);
  const demo = [
    { day: 0, time: "06:30", svc: "full-detail", price: DETAIL_PRICES.truck, name: "Marcus Webb", phone: "(555) 201-7788", vehicle: "2021 Ford F-150", address: "118 Oak Hill Dr, Elkton, VA" },
    { day: 0, time: "12:30", svc: "full-detail", price: DETAIL_PRICES.sedan, name: "Dana Whitfield", phone: "(555) 332-0091", vehicle: "2018 Honda Civic", address: "42 Meadow Ln, Harrisonburg, VA" },
    { day: 1, time: "06:30", svc: "full-detail", price: DETAIL_PRICES.suv, name: "Priya Nair", phone: "(555) 884-2310", vehicle: "2020 Toyota 4Runner", address: "301 Spring St, Elkton, VA" },
    { day: 1, time: "12:30", svc: "polish-1", price: 39900, name: "Sofia Romano", phone: "(555) 119-6654", vehicle: "2016 Mazda MX-5", address: "77 Valley View Rd, McGaheysville, VA" },
    { day: 2, time: "06:30", svc: "polish-2", price: 49900, name: "Grant Bennett", phone: "(555) 770-5512", vehicle: "2023 Chevrolet Corvette", address: "9 Bluff Ct, Massanutten, VA" },
  ];

  for (const d of demo) {
    const svc = byId[d.svc];
    const date = days[d.day];
    if (!svc || !date) continue;
    await prisma.appointment.create({
      data: {
        serviceId: svc.id,
        serviceName: svc.name,
        durationMinutes: svc.durationMinutes,
        priceCents: d.price,
        date,
        startTime: d.time,
        customerName: d.name,
        customerPhone: d.phone,
        customerEmail: "",
        vehicle: d.vehicle,
        serviceAddress: d.address,
        status: "CONFIRMED",
        source: "online",
      },
    });
  }
  console.log(`Seeded ${demo.length} demo appointments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

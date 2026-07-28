import { PrismaClient } from "@prisma/client";
import { SHOP } from "../src/lib/shop-config";

const prisma = new PrismaClient();

/** Services menu. `id` is a stable slug so re-seeding is idempotent. */
const SERVICES = [
  {
    id: "the-revival",
    name: "The Full Revival",
    description:
      "Our signature package — complete deep interior plus full exterior detail, bumper to bumper.",
    durationMinutes: 300,
    priceCents: 25000,
    category: "Packages",
  },
  {
    id: "showroom",
    name: "Showroom Package",
    description:
      "The Full Revival plus a one-step machine polish for real gloss. The closest thing to a new car.",
    durationMinutes: 420,
    priceCents: 40000,
    category: "Packages",
  },
  {
    id: "express-wash",
    name: "Express Hand Wash",
    description:
      "Foam bath, two-bucket hand wash, wheels and tires dressed, spot-free dry.",
    durationMinutes: 45,
    priceCents: 3000,
    category: "Exterior",
  },
  {
    id: "wash-wax",
    name: "Hand Wash & Wax",
    description:
      "The Express Hand Wash finished with a premium carnauba wax for depth and protection.",
    durationMinutes: 90,
    priceCents: 7000,
    category: "Exterior",
  },
  {
    id: "exterior-detail",
    name: "Full Exterior Detail",
    description:
      "Iron decontamination, clay bar, hand wash, and a durable paint sealant — trim and glass included.",
    durationMinutes: 150,
    priceCents: 13000,
    category: "Exterior",
  },
  {
    id: "engine-bay",
    name: "Engine Bay Detail",
    description: "Careful degrease, rinse, and dress for a clean, factory-fresh bay.",
    durationMinutes: 45,
    priceCents: 5000,
    category: "Exterior",
  },
  {
    id: "headlights",
    name: "Headlight Restoration",
    description: "Wet-sand, polish, and seal cloudy lenses back to clear.",
    durationMinutes: 60,
    priceCents: 7000,
    category: "Exterior",
  },
  {
    id: "interior-refresh",
    name: "Interior Refresh",
    description:
      "Full vacuum, wipe-down of all surfaces, glass, and door jambs. Perfect between deep details.",
    durationMinutes: 75,
    priceCents: 6000,
    category: "Interior",
  },
  {
    id: "interior-detail",
    name: "Deep Interior Detail",
    description:
      "Steam clean, carpet and seat shampoo, leather cleaned and conditioned, every vent and crevice.",
    durationMinutes: 180,
    priceCents: 16000,
    category: "Interior",
  },
  {
    id: "odor",
    name: "Ozone Odor Treatment",
    description: "Neutralize smoke, pet, and food odors at the source — not cover them up.",
    durationMinutes: 60,
    priceCents: 6000,
    category: "Interior",
  },
  {
    id: "pet-hair",
    name: "Pet Hair Removal",
    description: "Dedicated tools and patience for even the most embedded fur.",
    durationMinutes: 45,
    priceCents: 4000,
    category: "Interior",
  },
  {
    id: "polish-1",
    name: "One-Step Paint Correction",
    description:
      "A single machine-polish pass that removes most swirls and light scratches for a deep gloss.",
    durationMinutes: 240,
    priceCents: 27500,
    category: "Correction & Coating",
  },
  {
    id: "polish-2",
    name: "Two-Step Paint Correction",
    description:
      "Compound then polish for maximum defect removal — the prep of choice before ceramic.",
    durationMinutes: 360,
    priceCents: 45000,
    category: "Correction & Coating",
  },
  {
    id: "ceramic",
    name: "Ceramic Coating (2-Year)",
    description:
      "Professional-grade ceramic coating over corrected paint. Years of gloss, slickness, and easy washes.",
    durationMinutes: 480,
    priceCents: 65000,
    category: "Correction & Coating",
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
  console.log(`Seeded ${SERVICES.length} services.`);

  const count = await prisma.appointment.count();
  if (count > 0) {
    console.log(`Skipped demo appointments (${count} already exist).`);
    return;
  }

  const byId = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const days = nextOpenDays(3);
  const demo = [
    { day: 0, time: "08:30", svc: "the-revival", name: "Marcus Webb", phone: "(555) 201-7788", vehicle: "2021 Ford F-150", status: "CONFIRMED" },
    { day: 0, time: "14:00", svc: "express-wash", name: "Dana Whitfield", phone: "(555) 332-0091", vehicle: "2018 Honda Civic", status: "CONFIRMED" },
    { day: 1, time: "09:00", svc: "interior-detail", name: "Priya Nair", phone: "(555) 884-2310", vehicle: "2020 Toyota 4Runner", status: "CONFIRMED" },
    { day: 1, time: "13:00", svc: "wash-wax", name: "Sofia Romano", phone: "(555) 119-6654", vehicle: "2016 Mazda MX-5", status: "CONFIRMED" },
    { day: 2, time: "08:00", svc: "ceramic", name: "Grant Bennett", phone: "(555) 770-5512", vehicle: "2023 Chevrolet Corvette", status: "CONFIRMED" },
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
        priceCents: svc.priceCents,
        date,
        startTime: d.time,
        customerName: d.name,
        customerPhone: d.phone,
        customerEmail: "",
        vehicle: d.vehicle,
        status: d.status,
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

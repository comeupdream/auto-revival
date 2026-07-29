/**
 * Vehicle types, detail pricing, and add-ons.
 *
 * The Full Detail (interior + exterior base wash & clean) is priced by
 * vehicle type; add-ons and paint correction are flat-priced. The type is
 * auto-detected from the year/make/model the customer enters and can be
 * corrected with one tap in the booking form. Pure functions/constants,
 * shared by the booking form (live price preview) and the server (the price
 * actually stored on the appointment).
 */

export type VehicleClass = "sedan" | "suv" | "truck" | "minivan";

export const VEHICLE_CLASSES: VehicleClass[] = ["sedan", "suv", "truck", "minivan"];

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  sedan: "Coupe / Sedan / Hatchback",
  suv: "SUV",
  truck: "Truck",
  minivan: "Minivan",
};

/** Full Detail price per vehicle type. */
export const DETAIL_PRICES: Record<VehicleClass, number> = {
  sedan: 19900, // $199
  suv: 24900, // $249
  truck: 27900, // $279
  minivan: 29900, // $299
};

/** Flat-priced add-ons, attached to a booking on top of the main service. */
export type AddOn = {
  id: string;
  name: string;
  priceCents: number;
  minutes: number;
  description: string;
};

export const ADD_ONS: AddOn[] = [
  {
    id: "clay-bar",
    name: "Clay Bar Treatment",
    priceCents: 3900, // $39
    minutes: 30,
    description: "Pulls embedded contaminants out of the paint for a glass-smooth finish.",
  },
  {
    id: "engine-bay",
    name: "Engine Bay Cleaning",
    priceCents: 5900, // $59
    minutes: 45,
    description: "Careful degrease, rinse, and dress for a clean, factory-fresh bay.",
  },
];

export function isVehicleClass(v: unknown): v is VehicleClass {
  return typeof v === "string" && (VEHICLE_CLASSES as string[]).includes(v);
}

const MINIVAN_RE =
  /\b(odyssey|sienna|pacifica|carnival|sedona|grand\s?caravan|caravan|quest|town\s?&?\s?country|voyager|transit\s?connect|metris|minivan|mini.?van)\b/i;

const TRUCK_RE =
  /\b(f.?[123]50|silverado|sierra|ram\s?\d{4}|ram|tundra|titan|tacoma|colorado|canyon|ranger|maverick|frontier|ridgeline|gladiator|cybertruck|santa\s?cruz|dakota|avalanche|sprinter|transit(?!\s?connect)|promaster|express|savana|pickup|truck|dually)\b/i;

const SUV_RE =
  /\b(cr.?v|rav.?4|rogue|murano|pathfinder|armada|tucson|santa\s?fe|palisade|sportage|sorento|telluride|cx.?[3459]0?|forester|outback|crosstrek|ascent|escape|edge|explorer|expedition|bronco|equinox|blazer|trailblazer|traverse|tahoe|suburban|yukon|escalade|compass|cherokee|wrangler|wagoneer|highlander|4.?runner|sequoia|land\s?cruiser|venza|rx|nx|gx|ux|lx|x[1357]|glb|glc|gle|gls|g\s?63|g\s?550|q[3578]|macan|cayenne|tiguan|taos|atlas|encore|envision|enclave|xc[469]0|model\s?[xy]|mach.?e|id\.?4|ev[69]|ioniq\s?5|kona|seltos|niro|hr.?v|passport|pilot|trax|range\s?rover|defender|discovery|outlander|eclipse\s?cross|cx|suv|crossover)\b/i;

/** Best-effort vehicle type from a free-form "year make model" string. */
export function classifyVehicle(vehicle: string): VehicleClass {
  const v = vehicle.trim();
  if (!v) return "sedan";
  if (MINIVAN_RE.test(v)) return "minivan";
  if (TRUCK_RE.test(v)) return "truck";
  if (SUV_RE.test(v)) return "suv";
  return "sedan";
}

/**
 * The price of a main service for a given vehicle type. The Full Detail is
 * priced by type; everything else is flat.
 */
export function priceForService(
  serviceId: string,
  basePriceCents: number,
  cls: VehicleClass,
): number {
  return serviceId === "full-detail" ? DETAIL_PRICES[cls] : basePriceCents;
}

/** Common makes for the booking form's Make dropdown. */
export const VEHICLE_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia",
  "Land Rover", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mini",
  "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota",
  "Volkswagen", "Volvo", "Other",
] as const;

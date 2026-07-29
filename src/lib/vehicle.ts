/**
 * Vehicle size classification + size-based pricing.
 *
 * Detailing effort scales with vehicle size, so listed prices are for a
 * sedan and larger classes carry a multiplier. The class is inferred from
 * the year/make/model the customer enters; pure functions, shared by the
 * booking form (live price preview) and the server (the price actually
 * stored on the appointment).
 */

export type VehicleClass = "sedan" | "midsize" | "large";

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  sedan: "Car / Sedan",
  midsize: "Small SUV / Crossover",
  large: "Truck / Large SUV / Van",
};

/** Price multiplier per size class (sedan is the listed price). */
export const CLASS_MULTIPLIER: Record<VehicleClass, number> = {
  sedan: 1,
  midsize: 1.15,
  large: 1.3,
};

const LARGE_RE =
  /\b(f.?[123]50|silverado|sierra|ram\s?\d{4}|ram|tundra|titan|tahoe|suburban|yukon|escalade|expedition|navigator|sequoia|armada|4.?runner|pilot|palisade|telluride|traverse|atlas|explorer|wagoneer|land\s?cruiser|gx|lx\s?\d{3}|qx80|x7|gls|g\s?63|g\s?550|range\s?rover|defender|excursion|hummer|bronco(?!\s?sport)|gladiator|ridgeline|frontier|tacoma|colorado|ranger|maverick|sprinter|transit|promaster|express|savana|odyssey|sienna|pacifica|carnival|caravan|van|truck|dually)\b/i;

const MID_RE =
  /\b(cr.?v|rav.?4|rogue|murano|pathfinder|tucson|santa\s?fe|sportage|sorento|cx.?[59]0?|forester|outback|crosstrek|escape|edge|equinox|blazer|trailblazer|compass|cherokee|wrangler|highlander|venza|nx|rx|ux|x[135]|glb|glc|gle|q[357]|macan|cayenne|tiguan|taos|bronco\s?sport|encore|envision|enclave|xc[469]0|model\s?[xy]|mach.?e|id\.?4|ev[69]|ioniq\s?5|kona|seltos|niro|hr.?v|trax|crossover|suv)\b/i;

/** Best-effort size class from a free-form "year make model" string. */
export function classifyVehicle(vehicle: string): VehicleClass {
  const v = vehicle.trim();
  if (!v) return "sedan";
  if (LARGE_RE.test(v)) return "large";
  if (MID_RE.test(v)) return "midsize";
  return "sedan";
}

/** Apply the class multiplier to a base (sedan) price, rounded to $5. */
export function adjustedPriceCents(baseCents: number, cls: VehicleClass): number {
  return Math.round((baseCents * CLASS_MULTIPLIER[cls]) / 500) * 500;
}

/** Common makes for the booking form's Make dropdown. */
export const VEHICLE_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia",
  "Land Rover", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mini",
  "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota",
  "Volkswagen", "Volvo", "Other",
] as const;

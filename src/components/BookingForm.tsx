"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import {
  ADD_ONS,
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  VEHICLE_MAKES,
  classifyVehicle,
  priceForService,
  type VehicleClass,
} from "@/lib/vehicle";

export type BookingService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

type Props = {
  services: BookingService[];
  minDate: string;
  maxDate: string;
  quickDates: string[];
  initialServiceId?: string;
};

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Your vehicle", "Service", "Date & time"];

const YEARS = (() => {
  const max = new Date().getFullYear() + 1;
  const out: string[] = [];
  for (let y = max; y >= 1960; y--) out.push(String(y));
  return out;
})();

export default function BookingForm({
  services,
  minDate,
  maxDate,
  quickDates,
  initialServiceId = "",
}: Props) {
  const validInitial = services.some((s) => s.id === initialServiceId)
    ? initialServiceId
    : "";

  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState(validInitial);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [vYear, setVYear] = useState("");
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [typeOverride, setTypeOverride] = useState<VehicleClass | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState<null | {
    service: string;
    addOns: string;
    date: string;
    time: string;
    name: string;
    vehicle: string;
    address: string;
    priceCents: number;
  }>(null);

  // Vehicle string + type. The type is auto-detected from make/model and can
  // be corrected with the chips; it sets the Full Detail price.
  const vehicleStr = [vYear, vMake === "Other" ? "" : vMake, vModel]
    .filter(Boolean)
    .join(" ")
    .trim();
  const autoClass = classifyVehicle(vehicleStr);
  const vClass: VehicleClass = typeOverride ?? autoClass;

  const priceMain = (s: BookingService) => priceForService(s.id, s.priceCents, vClass);
  const chosenAddOns = ADD_ONS.filter((a) => addOnIds.includes(a.id));
  const addOnMinutes = chosenAddOns.reduce((sum, a) => sum + a.minutes, 0);
  const addOnCents = chosenAddOns.reduce((sum, a) => sum + a.priceCents, 0);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );
  const totalCents = service ? priceMain(service) + addOnCents : addOnCents;

  const grouped = useMemo(() => {
    const m = new Map<string, BookingService[]>();
    for (const s of services) {
      if (!m.has(s.category)) m.set(s.category, []);
      m.get(s.category)!.push(s);
    }
    return Array.from(m.entries());
  }, [services]);

  // Fetch availability whenever the service, add-ons, or date change (add-ons
  // extend the job, which can rule out the last slot of the day).
  const reqId = useRef(0);
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    const id = ++reqId.current;
    setLoadingSlots(true);
    setSlotError("");
    setTime("");
    fetch(`/api/availability?date=${date}&serviceId=${serviceId}&extra=${addOnMinutes}`)
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return; // stale response
        if (Array.isArray(data.slots)) setSlots(data.slots);
        else {
          setSlots([]);
          setSlotError(data.error ?? "Could not load times.");
        }
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setSlots([]);
        setSlotError("Could not load times. Please try again.");
      })
      .finally(() => {
        if (id === reqId.current) setLoadingSlots(false);
      });
  }, [serviceId, date, addOnMinutes]);

  function pickService(id: string) {
    if (id !== serviceId) {
      setDate("");
      setTime("");
    }
    setServiceId(id);
  }

  function toggleAddOn(id: string) {
    setAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canContinueDetails = Boolean(form.name.trim() && emailOk && form.address.trim());

  async function submit() {
    if (!service || !date || !time || !canContinueDetails) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          startTime: time,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
          vehicle: vehicleStr,
          vehicleType: vClass,
          addOns: addOnIds,
          serviceAddress: form.address,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        // If the slot was taken, refresh availability.
        if (res.status === 409) {
          setTime("");
          reqId.current++;
          const r = await fetch(
            `/api/availability?date=${date}&serviceId=${service.id}&extra=${addOnMinutes}`,
          );
          const d = await r.json();
          setSlots(Array.isArray(d.slots) ? d.slots : []);
        }
        return;
      }
      setConfirmed({
        service: service.name,
        addOns: chosenAddOns.map((a) => a.name).join(", "),
        date,
        time,
        name: form.name.trim(),
        vehicle: vehicleStr,
        address: form.address.trim(),
        priceCents: totalCents,
      });
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ----------------------------------------------------------- Confirmation
  if (confirmed) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl">You&apos;re booked!</h2>
        <p className="mt-2 text-muted">
          Thanks, {confirmed.name.split(" ")[0]} — we&apos;ll come to you.
        </p>
        <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-xl2 border border-line bg-bg/60 p-6 text-left text-sm">
          <Row label="Service" value={confirmed.service} />
          {confirmed.addOns && <Row label="Add-ons" value={confirmed.addOns} />}
          {confirmed.vehicle && <Row label="Vehicle" value={confirmed.vehicle} />}
          <Row label="Date" value={formatDateLong(confirmed.date)} />
          <Row label="Arrival" value={formatTime12(confirmed.time)} />
          <Row label="Location" value={confirmed.address} />
          <Row label="Total" value={formatPrice(confirmed.priceCents)} />
        </div>
        <p className="mx-auto mt-6 max-w-sm text-xs text-muted">
          Please have a water supply (outdoor spigot) available and the
          vehicle accessible when we arrive.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
          <button
            className="btn-accent"
            onClick={() => {
              setConfirmed(null);
              setServiceId("");
              setAddOnIds([]);
              setDate("");
              setTime("");
              setVYear("");
              setVMake("");
              setVModel("");
              setTypeOverride(null);
              setForm({ name: "", phone: "", email: "", address: "", notes: "" });
              setStep(1);
            }}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(service && date && time && canContinueDetails) && !submitting;

  return (
    <div className="card overflow-hidden">
      {/* Stepper */}
      <ol className="grid grid-cols-3 border-b border-line text-sm">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`flex items-center justify-center gap-2 px-2 py-4 text-center ${
                active ? "bg-accent/5" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  active
                    ? "bg-accent text-black"
                    : done
                      ? "bg-accent/15 text-accent"
                      : "bg-line text-muted"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={active ? "font-medium text-ink" : "text-muted"}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="p-6 sm:p-8">
        {/* ---------------------------------------- Step 1: Vehicle & details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                Your vehicle
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="field-label" htmlFor="v-year">
                    Year
                  </label>
                  <select
                    id="v-year"
                    className="field-input"
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="v-make">
                    Make
                  </label>
                  <select
                    id="v-make"
                    className="field-input"
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {VEHICLE_MAKES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="v-model">
                    Model
                  </label>
                  <input
                    id="v-model"
                    className="field-input"
                    value={vModel}
                    onChange={(e) => {
                      setVModel(e.target.value);
                      setTypeOverride(null); // re-detect on model change
                    }}
                    placeholder="M3, F-150, CR-V…"
                  />
                </div>
              </div>

              <div className="mt-4">
                <span className="field-label">
                  Vehicle type <span className="text-xs font-normal text-muted">(sets your Full Detail price)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_CLASSES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTypeOverride(c)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                        vClass === c
                          ? "border-accent bg-accent font-semibold text-black"
                          : "border-line text-muted hover:border-accent/40 hover:text-ink"
                      }`}
                    >
                      {VEHICLE_CLASS_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                Your details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="name">
                    Full name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="name"
                    className="field-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jamie Rivera"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    className="field-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="email">
                    Email <span className="text-accent">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                    aria-invalid={form.email.length > 0 && !emailOk}
                  />
                  {form.email.length > 0 && !emailOk && (
                    <p className="mt-1 text-xs text-accent">Enter a valid email address.</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="address">
                    Service address <span className="text-accent">*</span>
                  </label>
                  <input
                    id="address"
                    className="field-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street address, city — where the vehicle will be"
                    autoComplete="street-address"
                  />
                  <p className="mt-1 text-xs text-muted">
                    We&apos;re a mobile detailer — we come to you. Please make
                    sure we&apos;ll have access to a water supply (an outdoor
                    spigot) at this address.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="notes">
                    Anything we should know? (optional)
                  </label>
                  <textarea
                    id="notes"
                    className="field-input min-h-20 resize-y"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Heavy pet hair in the back seats, water spots on the hood, gate code…"
                  />
                </div>
              </div>
            </div>

            <p className="rounded-xl2 border border-accent/20 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-accent">A kind note:</span>{" "}
              if an interior needs extra love — deep-set stains, heavy trash,
              or the aftermath of kids or pets — an additional fee may apply
              for the extra time and product. We&apos;ll always look the
              vehicle over with you and agree on any adjustment before we
              start.
            </p>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!canContinueDetails}
                className="btn-accent"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- Step 2: Service */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="rounded-xl2 border border-line bg-bg/50 px-4 py-3 text-sm">
              Prices shown for{" "}
              <span className="font-medium text-ink">
                {vehicleStr || VEHICLE_CLASS_LABELS[vClass]}
              </span>{" "}
              <span className="text-muted">({VEHICLE_CLASS_LABELS[vClass]} rate)</span>
              {" · "}
              <button
                onClick={() => setStep(1)}
                className="font-medium text-accent hover:underline"
              >
                change
              </button>
            </div>

            {grouped.map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                  {category}
                </h3>
                <div className="grid gap-3">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => pickService(s.id)}
                      className={`group flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all hover:border-accent/50 hover:shadow-sm ${
                        s.id === serviceId
                          ? "border-accent bg-accent/5"
                          : "border-line bg-bg/40"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{s.name}</div>
                        <div className="mt-0.5 truncate text-sm text-muted">
                          {s.description}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="font-medium tabular-nums">
                          {formatPrice(priceMain(s))}
                        </span>
                        <span className="text-xs text-muted">
                          {formatDuration(s.durationMinutes)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                Add-ons
              </h3>
              <div className="grid gap-3">
                {ADD_ONS.map((a) => {
                  const on = addOnIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAddOn(a.id)}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                        on ? "border-accent bg-accent/5" : "border-line bg-bg/40 hover:border-accent/40"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                            on ? "border-accent bg-accent text-black" : "border-line text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">{a.name}</div>
                          <div className="mt-0.5 truncate text-sm text-muted">
                            {a.description}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">
                        +{formatPrice(a.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
              <button onClick={() => setStep(1)} className="btn-ghost">
                ← Back
              </button>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="text-muted">Total</div>
                  <div className="text-lg font-semibold tabular-nums text-accent">
                    {service ? formatPrice(totalCents) : "—"}
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
                  disabled={!service}
                  className="btn-accent"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------ Step 3: Date & time */}
        {step === 3 && service && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl2 border border-line bg-bg/50 p-4">
              <div>
                <div className="font-medium">
                  {service.name}
                  {chosenAddOns.length > 0 && (
                    <span className="text-muted">
                      {" "}
                      + {chosenAddOns.map((a) => a.name).join(", ")}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted">
                  {formatDuration(service.durationMinutes + addOnMinutes)} ·{" "}
                  <span className="font-medium text-accent">{formatPrice(totalCents)}</span>
                  {vehicleStr && <> · {vehicleStr}</>}
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="field-label" htmlFor="date">
                Choose a date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="field-input max-w-xs"
              />
              {quickDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        date === d
                          ? "border-accent bg-accent text-black"
                          : "border-line text-muted hover:border-accent/40 hover:text-ink"
                      }`}
                    >
                      {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {date && (
              <div>
                <div className="field-label">Available arrival times</div>
                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-line/60" />
                    ))}
                  </div>
                ) : slotError ? (
                  <p className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">
                    {slotError}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="rounded-lg border border-line bg-bg/50 px-4 py-3 text-sm text-muted">
                    No openings for this date. Try another day above.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTime(s)}
                        className={`rounded-lg border px-2 py-2.5 text-sm tabular-nums transition-all ${
                          time === s
                            ? "border-accent bg-accent text-black shadow-sm"
                            : "border-line hover:border-accent/50 hover:bg-accent/5"
                        }`}
                      >
                        {formatTime12(s)}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  We arrive at your address at the chosen time — please have
                  the vehicle and a water spigot accessible.
                </p>
              </div>
            )}

            {submitError && (
              <p className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(2)} className="btn-ghost">
                ← Back
              </button>
              <button onClick={submit} disabled={!canSubmit} className="btn-accent">
                {submitting ? "Booking…" : `Confirm booking · ${formatPrice(totalCents)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

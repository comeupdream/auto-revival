"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import {
  VEHICLE_CLASS_LABELS,
  VEHICLE_MAKES,
  adjustedPriceCents,
  classifyVehicle,
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [vYear, setVYear] = useState("");
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState<null | {
    service: string;
    date: string;
    time: string;
    name: string;
    vehicle: string;
    priceCents: number;
  }>(null);

  // The vehicle string drives size-class pricing everywhere below.
  const vehicleStr = [vYear, vMake === "Other" ? "" : vMake, vModel]
    .filter(Boolean)
    .join(" ")
    .trim();
  const vClass = classifyVehicle(vehicleStr);
  const priceFor = (s: BookingService) => adjustedPriceCents(s.priceCents, vClass);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const grouped = useMemo(() => {
    const m = new Map<string, BookingService[]>();
    for (const s of services) {
      if (!m.has(s.category)) m.set(s.category, []);
      m.get(s.category)!.push(s);
    }
    return Array.from(m.entries());
  }, [services]);

  // Fetch availability whenever the service or date changes.
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
    fetch(`/api/availability?date=${date}&serviceId=${serviceId}`)
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
  }, [serviceId, date]);

  function pickService(id: string) {
    setServiceId(id);
    setDate("");
    setTime("");
    setStep(3);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canContinueDetails = Boolean(form.name.trim() && emailOk);

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
          const r = await fetch(`/api/availability?date=${date}&serviceId=${service.id}`);
          const d = await r.json();
          setSlots(Array.isArray(d.slots) ? d.slots : []);
        }
        return;
      }
      setConfirmed({
        service: service.name,
        date,
        time,
        name: form.name.trim(),
        vehicle: vehicleStr,
        priceCents: priceFor(service),
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
          Thanks, {confirmed.name.split(" ")[0]} — we can&apos;t wait to get to work.
        </p>
        <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-xl2 border border-line bg-bg/60 p-6 text-left text-sm">
          <Row label="Service" value={confirmed.service} />
          {confirmed.vehicle && <Row label="Vehicle" value={confirmed.vehicle} />}
          <Row label="Date" value={formatDateLong(confirmed.date)} />
          <Row label="Drop-off" value={formatTime12(confirmed.time)} />
          <Row label="Price" value={formatPrice(confirmed.priceCents)} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
          <button
            className="btn-accent"
            onClick={() => {
              setConfirmed(null);
              setServiceId("");
              setDate("");
              setTime("");
              setVYear("");
              setVMake("");
              setVModel("");
              setForm({ name: "", phone: "", email: "", notes: "" });
              setStep(1);
            }}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(date && time && canContinueDetails) && !submitting;
  const hasVehicleInfo = Boolean(vehicleStr);

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
                    onChange={(e) => setVModel(e.target.value)}
                    placeholder="M3, F-150, CR-V…"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                {hasVehicleInfo ? (
                  <>
                    Priced as <span className="font-medium text-accent">{VEHICLE_CLASS_LABELS[vClass]}</span>
                    {vClass !== "sedan" &&
                      " — larger vehicles take more time and product, so prices adjust"}
                    .
                  </>
                ) : (
                  "Listed prices are car/sedan rates — trucks and SUVs adjust automatically."
                )}
              </p>
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
                  <p className="mt-1 text-xs text-muted">
                    We&apos;ll send your confirmation and a reminder here.
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
                    placeholder="Heavy pet hair in the back seats, water spots on the hood…"
                  />
                </div>
              </div>
            </div>

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
              {hasVehicleInfo ? (
                <>
                  Prices shown for your{" "}
                  <span className="font-medium text-ink">{vehicleStr}</span>{" "}
                  <span className="text-muted">
                    ({VEHICLE_CLASS_LABELS[vClass]} rates)
                  </span>
                </>
              ) : (
                <span className="text-muted">
                  Showing car/sedan rates —{" "}
                  <button
                    onClick={() => setStep(1)}
                    className="font-medium text-accent hover:underline"
                  >
                    add your vehicle
                  </button>{" "}
                  for exact pricing.
                </span>
              )}
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
                          {formatPrice(priceFor(s))}
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

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-ghost">
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------ Step 3: Date & time */}
        {step === 3 && service && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl2 border border-line bg-bg/50 p-4">
              <div>
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-muted">
                  {formatDuration(service.durationMinutes)} · {formatPrice(priceFor(service))}
                  {hasVehicleInfo && <> · {vehicleStr}</>}
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
                <div className="field-label">Available drop-off times</div>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
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
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                {submitting ? "Booking…" : "Confirm booking"}
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

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "@/lib/format";

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

const STEP_LABELS = ["Service", "Date & time", "Your details"];

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

  const [step, setStep] = useState<Step>(validInitial ? 2 : 1);
  const [serviceId, setServiceId] = useState(validInitial);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState<null | {
    service: string;
    date: string;
    time: string;
    name: string;
    vehicle: string;
  }>(null);

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
    setStep(2);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  async function submit() {
    if (!service || !date || !time || !form.name.trim() || !emailOk) return;
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
          vehicle: form.vehicle,
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
          setStep(2);
        }
        return;
      }
      setConfirmed({
        service: service.name,
        date,
        time,
        name: form.name.trim(),
        vehicle: form.vehicle.trim(),
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
              setForm({ name: "", phone: "", email: "", vehicle: "", notes: "" });
              setStep(1);
            }}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  const canContinueDate = Boolean(date && time);
  const canSubmit = Boolean(date && time && form.name.trim() && emailOk) && !submitting;

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
        {/* ----------------------------------------------------- Step 1: Service */}
        {step === 1 && (
          <div className="space-y-8">
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
                      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-bg/40 p-4 text-left transition-all hover:border-accent/50 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{s.name}</div>
                        <div className="mt-0.5 truncate text-sm text-muted">
                          {s.description}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="font-medium tabular-nums">
                          {formatPrice(s.priceCents)}
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
          </div>
        )}

        {/* ------------------------------------------------ Step 2: Date & time */}
        {step === 2 && service && (
          <div className="space-y-6">
            <SelectedServiceBar
              service={service}
              onChange={() => setStep(1)}
            />

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

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-ghost">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueDate}
                className="btn-accent"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- Step 3: Details */}
        {step === 3 && service && (
          <div className="space-y-6">
            <div className="rounded-xl2 border border-line bg-bg/50 p-5">
              <div className="text-sm text-muted">You&apos;re booking</div>
              <div className="mt-1 font-serif text-xl">{service.name}</div>
              <div className="mt-1 text-sm text-muted">
                {formatDateLong(date)} at {formatTime12(time)} ·{" "}
                {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                Change date or time
              </button>
            </div>

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
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="vehicle">
                  Vehicle (year, make &amp; model)
                </label>
                <input
                  id="vehicle"
                  className="field-input"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  placeholder="2019 BMW M3"
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

function SelectedServiceBar({
  service,
  onChange,
}: {
  service: BookingService;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl2 border border-line bg-bg/50 p-4">
      <div>
        <div className="font-medium">{service.name}</div>
        <div className="text-sm text-muted">
          {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
        </div>
      </div>
      <button onClick={onChange} className="text-xs font-medium text-accent hover:underline">
        Change
      </button>
    </div>
  );
}

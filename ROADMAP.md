# Roadmap — after the first engagement

Ideas queued for future rounds, roughly ordered by value-for-effort.

## Communication
- **Text message notifications** (Twilio) — booking confirmation, 24-hour
  reminder, and an "on our way" text the owner can fire from the job book.
  Mirrors the email layer: safe no-op until API keys are set. Requires a
  consent checkbox at booking (TCPA) and US A2P 10DLC registration.
- **Reschedule / cancel links in emails** — tokenized self-serve links so
  customers can move or cancel a booking without calling; frees the owner
  from phone tag.
- **Review request automation** — when a job is marked Completed, send a
  thank-you email/text with a one-tap link to leave a testimonial (and a
  Google review link once the business profile exists).

## Reviews & reputation
- **Customer review import from Facebook** — one-time import of existing FB
  recommendations into the Testimonials section, with attribution.
- **Google Business Profile** — the single biggest local-SEO lever for a
  mobile detailer; feeds Maps, "near me" searches, and Google reviews.
- **LocalBusiness structured data** on the site so search engines show
  hours, service area, and ratings.

## Payments
- **Online payment processing** (Stripe) — credit/debit acceptance at
  booking or on completion.
- **Deposits** — small advance deposits for large details (corrections,
  ceramic) and far-travel bookings; auto-refund rules for cancellations
  with notice.
- **Tips + invoices/receipts** emailed on completion.
- **Gift cards** — sell prepaid details for holidays.

## Scheduling & operations
- **Travel-fee by distance** — enter an address, get an automatic travel
  surcharge outside the free radius (zip/drive-distance based).
- **Owner calendar sync** — push jobs to Google Calendar.
- **Multi-crew capacity** — allow 2+ jobs per slot when a second crew
  exists.
- **Before/after photos on the job** — attach photos to an appointment in
  the job book; best pairs publish to Our Work with a slider.
- **Weather flags** — surface rain forecasts on the admin calendar for
  outdoor jobs.

## Growth
- **Maintenance memberships** — recurring monthly/bi-weekly wash plans via
  Stripe subscriptions.
- **Referral program** — give $X, get $X credit tracked per customer.
- **Quote requests** for boats, RVs, motorcycles, and fleet/commercial
  accounts with invoicing.
- **Analytics** (Plausible or GA4) — where bookings come from, which
  services convert.

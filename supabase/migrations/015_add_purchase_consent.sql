-- UK/EU digital-content consent: the buyer ticks "I want my download to
-- start immediately, and I understand I lose my 14-day right to cancel
-- once it's available" before paying. The flag + timestamp are stamped
-- into Stripe metadata (Checkout session or PaymentIntent) by
-- /api/checkout and /api/payment-intent, and written here by
-- createOrGetPurchase() in lib/purchase.ts.
--
-- Existing rows default to false: those buyers were never shown the
-- checkbox, so recording them as having consented would be wrong.
alter table public.purchases
  add column if not exists consent_immediate_supply boolean not null default false,
  add column if not exists consent_at timestamptz;

-- Explicit grants. Purchases are only ever read/written server-side via
-- the service-role client (lib/supabase.ts serverClient()), so the new
-- columns are granted to service_role only — anon/authenticated get
-- no new column access.
grant select (consent_immediate_supply, consent_at) on public.purchases to service_role;
grant insert (consent_immediate_supply, consent_at) on public.purchases to service_role;
grant update (consent_immediate_supply, consent_at) on public.purchases to service_role;

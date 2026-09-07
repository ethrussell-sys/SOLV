-- One-time email-verification handshake for the A3 magic-link
-- re-download flow. The resulting logged-in state is a signed,
-- stateless cookie (email + expiry + HMAC) — this table only needs to
-- track single-use, short-lived tokens so a link can't be replayed
-- after it's been clicked once.
create table magic_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- token lookups are already covered by the unique constraint's implicit
-- index; this one supports rate-limiting / listing handshakes by email.
create index magic_links_email_idx on magic_links(email);

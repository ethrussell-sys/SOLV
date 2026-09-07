-- Catch-up migration: films.slug already exists in production (added
-- outside a tracked migration at some point — referenced by
-- app/watch/[slug]/page.tsx and app/api/submit/route.ts). ADD COLUMN
-- IF NOT EXISTS skips the whole clause, constraint included, when the
-- column already exists, so this is a safe no-op against the current
-- production schema and only takes effect on a database that doesn't
-- have it yet.
alter table films add column if not exists slug text unique;
create index if not exists films_slug_idx on films(slug);

-- No application code sets download_limit at insert time (createOrGetPurchase()'s
-- upsert in lib/purchase.ts omits it entirely) — every purchase gets whatever this
-- column's DEFAULT is, so raising the counted-path limit requires a migration, not
-- a code change.
--
-- 3 replaces the limit=1 set by migration 010. The purchase-token path (A2,
-- within the first 24h) stays unlimited/uncounted regardless — this only
-- affects the counted path: the emailed owner-link and the redemption code,
-- which share this same counter on the purchases row.
alter table purchases alter column download_limit set default 3;

-- Bump existing rows from the old default up to the new one. Guarded by
-- `where download_limit = 1` rather than an unconditional update, so a row
-- support may have already manually bumped above 1 isn't silently clobbered
-- back down.
update purchases set download_limit = 3 where download_limit = 1;

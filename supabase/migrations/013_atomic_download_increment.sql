-- Atomic compare-and-increment for purchases.download_count, replacing
-- the read-then-write pattern previously in /api/download and
-- /api/redeem, which let two concurrent requests both read a count
-- below the limit and both succeed. The UPDATE's row lock serializes
-- concurrent callers against the same purchase row, so only requests
-- that still satisfy download_count < download_limit at the time they
-- acquire the lock actually increment.
create or replace function increment_download_count(p_purchase_id uuid)
returns boolean
language plpgsql
as $$
declare
  updated_rows integer;
begin
  update purchases
  set download_count = download_count + 1
  where id = p_purchase_id
    and download_count < download_limit;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

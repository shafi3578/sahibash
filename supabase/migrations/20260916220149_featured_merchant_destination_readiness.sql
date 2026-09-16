-- A configured campaign can be active while its merchant destination is still
-- the seeded launch placeholder. Reject only NEW requests with an unready
-- destination; preserve every existing request, proof, promotion and audit row.
begin;

create function private.guard_featured_merchant_destination()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_destination text;
begin
  -- Exact ECMAScript \s set, independent of database locale: ASCII whitespace,
  -- NBSP, OGHAM SPACE, U+2000..U+200A, line/paragraph separators, narrow NBSP,
  -- medium mathematical/ideographic spaces and BOM. Keep parity with the app.
  v_destination := pg_catalog.lower(pg_catalog.btrim(pg_catalog.regexp_replace(
    coalesce(new.merchant_reference, ''),
    U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',
    ' ', 'g'
  ), ' '));

  if v_destination = ''
    or v_destination = 'configure merchant destination in super admin before launch' then
    raise exception 'featured payment destination is not configured' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_featured_merchant_destination()
  from public, anon, authenticated, service_role;

-- PostgreSQL runs same-event BEFORE triggers alphabetically. The existing
-- guard_featured_extension_consent runs first and matches NEW to the campaign
-- snapshot. This guard neither re-reads mutable configuration nor rewrites NEW.
create trigger guard_featured_merchant_destination
before insert on public.promotion_payment_requests
for each row execute function private.guard_featured_merchant_destination();

comment on function private.guard_featured_merchant_destination() is
  'INSERT-only fail-closed guard against blank or seeded placeholder merchant destinations; does not change existing payment requests or authorization.';

commit;

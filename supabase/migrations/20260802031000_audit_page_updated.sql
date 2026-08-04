begin;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'audit_action_type'
      and e.enumlabel = 'PAGE_UPDATED'
  ) then
    alter type public.audit_action_type add value 'PAGE_UPDATED';
  end if;
end
$$;

commit;
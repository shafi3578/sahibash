-- Production-safe RLS proof. No credentials or identities are emitted.
-- All no-op writes and trigger effects are rolled back.
begin;
do $fixtures$
declare admin_id uuid; owner_id uuid; draft_id uuid; category_id text;
begin
  select ur.user_id into admin_id from public.admin_user_roles ur
  join public.admin_roles r on r.id=ur.role_id
  where r.name='super_administrator' order by ur.user_id limit 1;
  select d.user_id,d.id into owner_id,draft_id from public.listing_drafts d
  where not exists(select 1 from public.admin_user_roles ur where ur.user_id=d.user_id)
  and not exists(select 1 from public.profiles p where p.id=d.user_id and p.role='admin')
  order by d.id limit 1;
  select id into category_id from public.categories order by id limit 1;
  if admin_id is null or owner_id is null or category_id is null then
    raise exception 'Existing safe MFA verification fixtures are unavailable';
  end if;
  perform set_config('sahibash.verify_admin',admin_id::text,true);
  perform set_config('sahibash.verify_owner',owner_id::text,true);
  perform set_config('sahibash.verify_draft',draft_id::text,true);
  perform set_config('sahibash.verify_category',category_id::text,true);
  perform set_config('sahibash.mfa_evidence','[]',true);
end;
$fixtures$;
set local role authenticated;
do $proof$
declare
 scenario text; subject_id text; aal text;
 read_rows integer; category_rows integer; draft_rows integer;
 evidence jsonb := '[]'::jsonb;
begin
 foreach scenario in array array['admin_aal1','admin_aal2','owner_aal1','owner_aal2']
 loop
  subject_id := current_setting(case when scenario like 'admin%' then 'sahibash.verify_admin' else 'sahibash.verify_owner' end);
  aal := case when scenario like '%aal2' then 'aal2' else 'aal1' end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',subject_id,'role','authenticated','aal',aal)::text,true);
  select count(*) into read_rows from public.admin_user_roles;
  update public.categories set id=id where id::text=current_setting('sahibash.verify_category');
  get diagnostics category_rows = row_count;
  update public.listing_drafts set id=id where id=current_setting('sahibash.verify_draft')::uuid;
  get diagnostics draft_rows = row_count;
  if scenario='admin_aal1' and (read_rows=0 or category_rows<>0 or draft_rows<>0) then
    raise exception 'AAL1 admin boundary failed';
  elsif scenario='admin_aal2' and (read_rows=0 or category_rows<>1 or draft_rows<>1) then
    raise exception 'AAL2 permitted admin operations failed';
  elsif scenario like 'owner%' and (read_rows<>0 or category_rows<>0 or draft_rows<>1) then
    raise exception 'Normal owner authorization changed';
  end if;
  evidence := evidence || jsonb_build_object('scenario',scenario,'admin_read_rows',read_rows,'category_update_rows',category_rows,'own_or_other_draft_update_rows',draft_rows,'passed',true);
 end loop;
 perform set_config('sahibash.mfa_evidence',evidence::text,true);
end;
$proof$;
reset role;
select current_setting('sahibash.mfa_evidence')::jsonb as policy_evidence;
rollback;

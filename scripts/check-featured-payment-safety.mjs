import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Optional isolated SQL verification; run from the repository root:
 *   npm install --prefix .temp/release-sql-harness --no-save --ignore-scripts --package-lock=false @electric-sql/pglite@0.5.8
 *   node scripts/check-featured-payment-safety.mjs
 *
 * Uses local migration files and synthetic in-memory fixtures only. It never reads
 * environment files, connects to Supabase, calls a provider, or writes live data.
 * The optional dependency stays ignored; no repository dependency changes needed.
 * Real payment tables, guard, approval/rejection RPCs, and safety migration are
 * loaded below. Surrounding schemas/auth/RLS are minimal models, not a full
 * Supabase integration test. Single-connection PGlite does not test concurrency.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let pgliteModule;
try {
  pgliteModule = await import('@electric-sql/pglite');
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  const localEntry = join(root, '.temp', 'release-sql-harness', 'node_modules', '@electric-sql', 'pglite', 'dist', 'index.js');
  try {
    pgliteModule = await import(pathToFileURL(localEntry).href);
  } catch (localError) {
    throw new Error('Optional PGlite is unavailable. Run the pinned install command at the top of this script.', { cause: localError });
  }
}
const { PGlite } = pgliteModule;
const db = new PGlite();
const migrationDirectory = join(root, 'supabase', 'migrations');
const read = (suffix) => {
  const matches = readdirSync(migrationDirectory).filter((name) => name.endsWith(suffix));
  assert.equal(matches.length, 1, `Expected exactly one migration ending in ${suffix}`);
  return readFileSync(join(migrationDirectory, matches[0]), 'utf8').replaceAll('\r\n', '\n');
};
const foundation = read('_step3_featured_payments_ai_foundation.sql');
const boundary = read('_enforce_step3_payment_aal2_boundary.sql');
const safety = read('_featured_payment_target_and_resubmission_safety.sql');
const table = (name) => {
  const start = foundation.indexOf(`create table if not exists public.${name} (`);
  assert.ok(start >= 0);
  return foundation.slice(start, foundation.indexOf('\n);', start) + 3);
};
const guardStart = boundary.indexOf('create or replace function public.guard_promotion_payment_request_mutation()');
const guardEnd = boundary.indexOf('revoke all on function public.guard_promotion_payment_request_mutation()');
const rpcStart = boundary.indexOf('create or replace function public.approve_featured_payment_request(');
const rpcEnd = boundary.indexOf('revoke all on function public.approve_featured_payment_request(');
const owner = '10000000-0000-4000-8000-000000000001';
const admin = '10000000-0000-4000-8000-000000000002';
const other = '10000000-0000-4000-8000-000000000003';
const contentAdmin = '10000000-0000-4000-8000-000000000004';
const config = '20000000-0000-4000-8000-000000000001';
let checks = 0;
const sql = async (query, params = []) => db.query(query, params);
const actor = async (id, aal = 'aal1') => {
  await db.exec('reset role');
  await sql("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, aal })]);
  await db.exec('set role authenticated');
};
const system = async () => db.exec('reset role');
const fails = async (query, pattern) => { await assert.rejects(sql(query), pattern); checks++; };
const listing = (n) => `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const request = (n) => `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const seedListing = async (n, extra = '') => {
  await system();
  await sql(`insert into public.listings(id,user_id,category_id,status,publication_status,freshness_status,price,expires_at)
    values('${listing(n)}','${owner}',1,'approved','published','seller_confirmed',100,now()+interval '60 days')`);
  if (extra) await sql(`update public.listings set ${extra} where id='${listing(n)}'`);
};
const createRequest = async (n, user = owner) => sql(`insert into public.promotion_payment_requests
  (id,listing_id,user_id,campaign_config_id,amount,payment_method,merchant_reference,idempotency_key)
  values('${request(n)}','${listing(n)}','${user}','${config}',30,'manual','synthetic-merchant','synthetic-request-${n}')`);
const submit = (n) => `update public.promotion_payment_requests set status='pending_review',transaction_reference='synthetic-proof',submitted_at=now() where id='${request(n)}'`;
const approve = (n) => `select * from public.approve_featured_payment_request('${request(n)}','synthetic approval')`;
const reject = (n) => `select public.reject_featured_payment_request('${request(n)}','synthetic unclear proof','synthetic prior review')`;

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    insert into auth.users values('${owner}'),('${admin}'),('${other}'),('${contentAdmin}');
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create function public.has_admin_permission(actor uuid, permission text) returns boolean language sql stable as $$select actor='${admin}'::uuid$$;
    create function public.is_admin(actor uuid) returns boolean language sql stable as $$select actor in ('${admin}'::uuid,'${contentAdmin}'::uuid)$$;
    create type public.promotion_type as enum('featured');
    create type public.promotion_payment_provider as enum('hesabpay');
    create type public.promotion_payment_request_status as enum('pending_payment','pending_review','approved','rejected','expired','cancelled');
    create table public.categories(id bigint primary key,is_active boolean,is_coming_soon boolean);
    insert into public.categories values(1,true,false),(2,false,false),(3,true,true),(4,null,false),(5,true,null);
    create table public.listings(id uuid primary key,user_id uuid references auth.users,category_id bigint references public.categories,
      status text,publication_status text,freshness_status text,removed_public_at timestamptz,price numeric,
      expires_at timestamptz,featured boolean default false,featured_until timestamptz,updated_at timestamptz default now());
    ${table('promotion_campaign_configs')}
    ${table('promotion_payment_requests')}
    create table public.listing_promotions(id uuid primary key default gen_random_uuid(),listing_id uuid references public.listings,
      promotion_type public.promotion_type,starts_at timestamptz,ends_at timestamptz,created_by uuid references auth.users,
      payment_request_id uuid references public.promotion_payment_requests,metadata jsonb default '{}');
    create unique index promotion_payment_unique on public.listing_promotions(payment_request_id) where payment_request_id is not null;
    create table public.audit_logs(id bigint generated always as identity primary key,
      admin_user_id uuid not null references auth.users(id), action text not null check(action=upper(action) and action ~ '^[A-Z][A-Z0-9_]{1,63}$'),
      entity_type text not null,entity_id text,safe_changes jsonb,ip_address inet,created_at timestamptz default now());
    ${boundary.slice(boundary.indexOf('create schema if not exists private;'), guardStart)}
    ${boundary.slice(guardStart, guardEnd)}
    ${boundary.slice(rpcStart, rpcEnd)}
    create trigger guard_promotion_payment_request_mutation before insert or update on public.promotion_payment_requests
      for each row execute function public.guard_promotion_payment_request_mutation();
    alter table public.promotion_payment_requests enable row level security;
    create policy owner_select on public.promotion_payment_requests for select to authenticated using(user_id=auth.uid() or public.has_admin_permission(auth.uid(),'payments.review'));
    create policy owner_insert on public.promotion_payment_requests for insert to authenticated with check(user_id=auth.uid());
    create policy owner_update on public.promotion_payment_requests for update to authenticated using(user_id=auth.uid() or public.has_admin_permission(auth.uid(),'payments.review')) with check(user_id=auth.uid() or public.has_admin_permission(auth.uid(),'payments.review'));
    alter table public.audit_logs enable row level security;
    create policy audit_logs_admin_only on public.audit_logs for select to authenticated using((select public.is_admin(auth.uid())));
    create policy admin_insert on public.audit_logs for insert to authenticated with check(public.has_admin_permission(auth.uid(),'audit.view'));
    grant usage on schema auth,private,public to authenticated,service_role;
    grant select,insert,update,delete on all tables in schema public to authenticated;
    grant usage,select on all sequences in schema public to authenticated;
    insert into public.promotion_campaign_configs(id,key,promotion_type,name_en,name_fa,name_ps,amount,currency,duration_days,provider,payment_method,merchant_reference,instructions_en,instructions_fa,instructions_ps,is_active)
    values('${config}','featured_launch','featured','Featured','Featured','Featured',30,'AFN',30,'hesabpay','manual','synthetic-merchant','synthetic','synthetic','synthetic',true);
  `);

  // Demonstrate the original rejected-proof regression before applying the real migration.
  await seedListing(1); await actor(owner); await createRequest(1); await sql(submit(1));
  await actor(admin,'aal2'); await sql(reject(1)); await actor(owner);
  await fails(submit(1), /client cannot set review fields/);
  await system(); await db.exec(safety);
  await actor(owner); await sql(`update public.promotion_payment_requests set status='pending_review',transaction_reference='synthetic-corrected-proof',receipt_storage_path='synthetic-owner/corrected-proof.png',submitted_at=now() where id='${request(1)}'`);
  const corrected = (await sql(`select reviewed_at,reviewed_by,admin_note,rejection_reason,provider_status from public.promotion_payment_requests where id='${request(1)}'`)).rows[0];
  assert.deepEqual(Object.values(corrected), [null,null,null,null,null]); checks++;
  assert.equal((await sql('select count(*)::int as n from public.audit_logs')).rows[0].n,0); checks++;
  await fails(`insert into public.audit_logs(admin_user_id,action,entity_type) values('${owner}','FORGED_EVENT','payment')`,/row-level security/);
  await actor(admin,'aal2');
  const history = (await sql(`select safe_changes from public.audit_logs where entity_id='${request(1)}'`)).rows[0].safe_changes;
  assert.equal(history.previous_review.admin_note,'synthetic prior review');
  assert.equal(history.previous_review.rejection_reason,'synthetic unclear proof'); checks++;
  assert.equal(history.previous_proof.transaction_reference,'synthetic-proof');
  assert.equal(history.proof.transaction_reference,'synthetic-corrected-proof');
  assert.equal(history.proof.receipt_storage_path,'synthetic-owner/corrected-proof.png');checks++;
  await system();await sql(`insert into public.audit_logs(admin_user_id,action,entity_type) values('${admin}','CONTENT_UPDATED','static_page')`);
  await actor(contentAdmin);
  assert.equal((await sql("select count(*)::int as n from public.audit_logs where entity_type='promotion_payment_request'")).rows[0].n,0);checks++;
  assert.equal((await sql("select count(*)::int as n from public.audit_logs where entity_type='static_page'")).rows[0].n,1);checks++;
  await actor(owner);assert.equal((await sql('select count(*)::int as n from public.audit_logs')).rows[0].n,0);checks++;

  // Complete actual RPC-backed review cycle under the new guard/audit trigger.
  await seedListing(2); await actor(owner); await createRequest(2); await sql(submit(2));
  await fails(approve(2), /forbidden/);
  await actor(admin); await fails(approve(2), /aal2 required/);
  await actor(admin,'aal2'); await sql(reject(2)); await actor(owner);
  await fails(`update public.promotion_payment_requests set status='pending_review',admin_note='forged reviewer note' where id='${request(2)}'`,/client cannot set review fields/);
  await fails(`update public.promotion_payment_requests set status='pending_review',provider_status='forged' where id='${request(2)}'`,/client cannot set provider status/);
  await actor(other);
  assert.equal((await sql(`update public.promotion_payment_requests set status='pending_review' where id='${request(2)}' returning id`)).rows.length,0); checks++;
  await actor(owner); await sql(submit(2)); await actor(admin,'aal2'); await sql(approve(2)); await sql(approve(2));
  const audit = (await sql(`select action from public.audit_logs where entity_id='${request(2)}' order by id`)).rows.map(x=>x.action);
  assert.deepEqual(audit,['FEATURED_PAYMENT_PROOF_SUBMITTED','FEATURED_PAYMENT_REJECTED','FEATURED_PAYMENT_PROOF_RESUBMITTED','FEATURED_PAYMENT_APPROVED']); checks++;
  const activated = (await sql(`select featured,featured_until>now() as active,expires_at>now()+interval '59 days' as not_renewed from public.listings where id='${listing(2)}'`)).rows[0];
  assert.deepEqual(activated,{featured:true,active:true,not_renewed:true}); checks++;

  const blocked = ["expires_at=now()-interval '1 day'","expires_at=null","status='pending'","status='deleted'","publication_status='archived'","publication_status='removed'","removed_public_at=now()","freshness_status='source_missing'","freshness_status='sold_confirmed'","price=0","category_id=2","category_id=3","category_id=4","category_id=5"];
  for(let i=0;i<blocked.length;i++){const n=10+i; await seedListing(n,blocked[i]);await actor(owner);await fails(`insert into public.promotion_payment_requests(id,listing_id,user_id,campaign_config_id,amount,payment_method,merchant_reference,idempotency_key) values('${request(n)}','${listing(n)}','${owner}','${config}',30,'manual','synthetic-merchant','synthetic-request-${n}')`,/not eligible/);}
  await seedListing(30);await actor(owner);await createRequest(30);await sql(submit(30));
  await system();await sql(`update public.listings set expires_at=now()-interval '1 second' where id='${listing(30)}'`);await actor(admin,'aal2');await fails(approve(30),/not eligible/);
  assert.equal((await sql(`select status from public.promotion_payment_requests where id='${request(30)}'`)).rows[0].status,'pending_review');checks++;

  // Audit failure must roll back the payment transition, not silently lose evidence.
  await seedListing(31);await actor(owner);await createRequest(31);await system();
  await sql("alter table public.audit_logs add constraint forced_failure check(action<>'FEATURED_PAYMENT_PROOF_SUBMITTED') not valid");
  await actor(owner);await fails(submit(31),/forced_failure/);
  assert.equal((await sql(`select status from public.promotion_payment_requests where id='${request(31)}'`)).rows[0].status,'pending_payment');checks++;
  await system();await sql('alter table public.audit_logs drop constraint forced_failure');
  assert.equal((await sql("select has_function_privilege('authenticated','private.audit_featured_payment_transition()','EXECUTE') as allowed")).rows[0].allowed,false);checks++;

  // A reviewer correcting their own receipt must still clear the previous review.
  await seedListing(32,`user_id='${admin}'`);await actor(admin,'aal2');await createRequest(32,admin);
  await sql(submit(32));await sql(reject(32));await sql(submit(32));
  assert.deepEqual(Object.values((await sql(`select reviewed_at,reviewed_by,admin_note,rejection_reason,provider_status from public.promotion_payment_requests where id='${request(32)}'`)).rows[0]),[null,null,null,null,null]);checks++;
  assert.deepEqual((await sql(`select action from public.audit_logs where entity_id='${request(32)}' order by id`)).rows.map(x=>x.action),['FEATURED_PAYMENT_PROOF_SUBMITTED','FEATURED_PAYMENT_REJECTED','FEATURED_PAYMENT_PROOF_RESUBMITTED']);checks++;
  await system();await sql("select set_config('request.jwt.claims','{}',false)");await db.exec('set role service_role');
  await fails(approve(32),/forbidden/);
  console.log(JSON.stringify({passed:checks,productionWrites:0,fixtureScope:'in-memory PGlite; synthetic identities only'}));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await db.close(); }

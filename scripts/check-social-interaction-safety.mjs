import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Isolated social SQL verification (Node >=22.13):
 *   npm install --prefix .temp/release-sql-harness --no-save --ignore-scripts --package-lock=false @electric-sql/pglite@0.5.8
 *   node scripts/check-social-interaction-safety.mjs
 *
 * No environment files, credentials, network clients, browser, or live records.
 * PGlite is in-memory; every scenario rolls back its synthetic changes.
 * Real message/report/notification tables, policies, block/count triggers and
 * reviewed MFA policy expressions are loaded from repository migrations.
 * Auth, admin identity, a minimal listing table and baseline Supabase table
 * grants are modeled. This is not live-schema attestation, Realtime/provider
 * delivery, Next.js action execution, browser E2E, or concurrent-session proof.
 * Pure thread/link helpers execute from their actual TypeScript sources.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationDirectory = join(root, 'supabase', 'migrations');
const source = (path) => readFileSync(join(root, path), 'utf8').replaceAll('\r\n', '\n');
const loadedMigrations = new Set();
const migration = (suffix) => {
  const names = readdirSync(migrationDirectory).filter((name) => name.endsWith(suffix));
  assert.equal(names.length, 1, `Expected exactly one migration ending in ${suffix}`);
  loadedMigrations.add(names[0]);
  return source(`supabase/migrations/${names[0]}`);
};
const statement = (text, marker, ending = ';') => {
  const start = text.indexOf(marker);
  assert.ok(start >= 0, `Missing SQL marker: ${marker}`);
  const end = text.indexOf(ending, start);
  assert.ok(end > start, `Missing SQL ending: ${marker}`);
  return text.slice(start, end + ending.length);
};
const table = (text, name) => statement(text, `create table if not exists public.${name} (`, '\n);');
const policy = (text, name) => statement(text, `create policy ${name}\n`);
const quoteIdentifier = (name) => `"${name.replaceAll('"', '""')}"`;
const pureModule = async (path) => {
  const javascript = stripTypeScriptTypes(source(path), { mode: 'strip' });
  assert.doesNotMatch(javascript, /^\s*import\b/m, `Pure helper gained a runtime dependency: ${path}`);
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
};

let pgliteModule;
try {
  pgliteModule = await import('@electric-sql/pglite');
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  const entry = join(root, '.temp', 'release-sql-harness', 'node_modules', '@electric-sql', 'pglite', 'dist', 'index.js');
  try { pgliteModule = await import(pathToFileURL(entry).href); }
  catch (localError) {
    throw new Error('Install the optional pinned PGlite dependency using the command at the top of this script.', { cause: localError });
  }
}
const { PGlite } = pgliteModule;
const db = new PGlite();
const { buildMessageThreads } = await pureModule('lib/messages/threading.ts');
const { notificationDestination } = await pureModule('lib/notifications/destination.ts');
const buyer = '10000000-0000-4000-8000-000000000001';
const seller = '10000000-0000-4000-8000-000000000002';
const outsider = '10000000-0000-4000-8000-000000000003';
const admin = '10000000-0000-4000-8000-000000000004';
const listingId = '20000000-0000-4000-8000-000000000001';
const otherListing = '20000000-0000-4000-8000-000000000002';
const externalListing = '20000000-0000-4000-8000-000000000003';
const incoming = '30000000-0000-4000-8000-000000000001';
const reply = '30000000-0000-4000-8000-000000000002';
const notificationId = '40000000-0000-4000-8000-000000000001';
const reportId = '50000000-0000-4000-8000-000000000001';
const sql = (query, params = []) => db.query(query, params);
const actor = async (id, aal = 'aal1', role = 'authenticated') => {
  assert.ok(['authenticated', 'anon', 'service_role'].includes(role));
  await db.exec('reset role');
  await sql("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, aal })]);
  await db.exec(`set local role ${role}`);
};
const rows = async (query, params = []) => (await sql(query, params)).rows;
const count = async (query, params = []) => (await rows(query, params))[0].n;
const denied = async (query, params = [], code = '42501') => {
  await db.exec('savepoint expected_denial');
  let failure;
  try { await sql(query, params); } catch (error) { failure = error; }
  await db.exec('rollback to savepoint expected_denial; release savepoint expected_denial');
  assert.ok(failure, 'Expected database denial, but the write succeeded');
  assert.equal(failure.code, code, failure.message);
};
const results = [];
const check = async (name, run, kind = 'sql') => {
  await db.exec('reset role; begin');
  try {
    await run();
    results.push({ name, kind, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, kind, passed: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    await db.exec('rollback; reset role');
  }
};
const insertMessage = (from = buyer, to = seller, listing = listingId) => sql(
  'insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4) returning id',
  [listing, from, to, 'Synthetic integration message'],
);

try {
  const foundation = migration('_sahibash_v2_marketplace.sql');
  const optimized = migration('_optimize_step3_high_frequency_rls_policies.sql');
  const external = migration('_external_listing_request_workflow.sql');
  const privacy = migration('_phase1_public_listing_privacy_boundary.sql');
  const listingUpdate = migration('_harden_roles_and_listing_promotions.sql');
  const mfa = migration('_admin_mutation_mfa_policy_boundary.sql');
  const mfaTargets = JSON.parse(mfa.split('$reviewed_policy_snapshot$')[1]);
  const tables = ['messages', 'reports', 'notifications'];
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    insert into auth.users values('${buyer}'),('${seller}'),('${outsider}'),('${admin}');
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create function public.is_admin(uid uuid) returns boolean language sql stable as $$select uid='${admin}'::uuid and uid=auth.uid()$$;
    create function private.is_aal2() returns boolean language sql stable as $$select coalesce(auth.jwt()->>'aal'='aal2',false)$$;
    ${['listing_status', 'message_status', 'report_status', 'notification_type'].map((name) => statement(foundation, `create type public.${name} as enum`)).join('\n')}
    create table public.listings(id uuid primary key,user_id uuid references auth.users,
      status public.listing_status not null,publication_status text,source_type text,ownership_status text,
      messages_count integer not null default 0,featured boolean not null default false,urgent boolean not null default false,
      approved_by uuid,approved_at timestamptz,updated_at timestamptz not null default now());
    ${tables.map((name) => table(foundation, name)).join('\n')}
    ${[...tables, 'listings'].map((name) => `alter table public.${name} enable row level security;`).join('\n')}
    ${policy(privacy, 'listings_select_public_or_owner_or_admin')}
    ${policy(listingUpdate, 'listings_update_owner_limited_or_admin')}
    ${['messages_select_sender_or_recipient', 'messages_update_recipient_or_admin', 'reports_insert_reporter_only', 'reports_select_own_or_admin', 'reports_update_admin_only', 'reports_delete_admin_only'].map((name) => policy(optimized, name)).join('\n')}
    ${policy(external, 'messages_insert_sender_only')}
    ${statement(foundation, 'create or replace function public.adjust_message_count()', '\n$$;')}
    ${statement(foundation, 'create trigger trg_messages_adjust_count_ins\n')}
    ${statement(foundation, 'create or replace function public.set_updated_at()', '\n$$;')}
    create trigger trg_listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
    create trigger trg_reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
    alter function public.adjust_message_count() set search_path = public, pg_temp;
    grant usage on schema public,auth,private to anon,authenticated,service_role;
    grant select on public.listings to anon,authenticated;
    grant update on public.listings to authenticated;
    grant all on public.messages,public.reports to anon,authenticated;
    grant select,insert,update,delete on public.notifications to authenticated;
    grant all on all tables in schema public to service_role;
  `);

  const verifyHardening = async () => {
  const snapshot = async () => {
    const data = {};
    for (const name of ['listings', 'messages', 'reports', 'notifications', 'user_blocks', 'user_follows']) {
      data[name] = await rows(`select to_jsonb(t) row from public.${name} t order by to_jsonb(t)::text`);
    }
    return data;
  };
  const beforeHardening = await snapshot();
  const hardening = migration('_social_interaction_integrity.sql');
  await db.exec(hardening);
  await check('migration preserves every existing synthetic row without a backfill', async () => {
    assert.deepEqual(await snapshot(), beforeHardening);
  });
  await check('API roles cannot truncate tables or invoke private trigger helpers', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const name of ['messages', 'reports']) {
        for (const privilege of ['TRUNCATE', 'TRIGGER', 'REFERENCES']) {
          assert.equal((await rows('select has_table_privilege($1,$2,$3) allowed', [role, `public.${name}`, privilege]))[0].allowed, false);
        }
      }
      await actor(role === 'anon' ? null : buyer, 'aal1', role);
      await denied('truncate public.messages cascade');
      await denied('truncate public.reports');
    }
    await db.exec('reset role');
    const functions = ['private.lock_social_pair(uuid,uuid)', 'private.guard_block_insert()',
      'private.remove_blocked_follows()', 'private.adjust_message_count()', 'private.guard_message_integrity()',
      'private.guard_report_integrity()', 'public.enforce_message_block_boundary()', 'public.enforce_follow_block_boundary()',
      'public.adjust_message_count()'];
    for (const role of ['anon', 'authenticated', 'service_role']) {
      for (const name of functions) {
        assert.equal((await rows('select has_function_privilege($1,$2,$3) allowed', [role, name, 'EXECUTE']))[0].allowed, false, `${role} must not execute ${name}`);
      }
    }
  });
  await check('all social operations share a canonical transaction lock before block reads or cleanup', async () => {
    const definitions = await rows(`select n.nspname,p.proname,p.provolatile,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) body
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where (n.nspname='private' and p.proname in ('lock_social_pair','guard_block_insert','adjust_message_count','remove_blocked_follows'))
         or (n.nspname='public' and p.proname in ('enforce_message_block_boundary','enforce_follow_block_boundary'))`);
    assert.equal(definitions.length, 6);
    for (const fn of definitions) {
      assert.equal(fn.provolatile, 'v');
      assert.ok(fn.proconfig.includes('search_path=""'));
      if (fn.proname !== 'lock_social_pair') assert.equal(fn.prosecdef, true);
    }
    const lock = definitions.find((fn) => fn.proname === 'lock_social_pair').body;
    assert.match(lock, /pg_advisory_xact_lock/); assert.match(lock, /least\(first_user, second_user\)/);
    assert.match(lock, /greatest\(first_user, second_user\)/); assert.match(lock, /social-interaction:/);
    for (const name of ['enforce_message_block_boundary', 'enforce_follow_block_boundary', 'guard_block_insert']) {
      const body = definitions.find((fn) => fn.proname === name).body;
      assert.match(body, /perform private\.lock_social_pair/);
      assert.match(body, /auth\.uid\(\) is null/);
      if (name !== 'guard_block_insert') assert.ok(body.indexOf('perform private.lock_social_pair') < body.indexOf('if exists'));
    }
  });
  };
  // Apply actual reviewed final expressions, scoped to the modeled tables only.
  const selectedMfa = mfaTargets.filter((target) => ['messages', 'reports'].includes(target.tablename)
    || (target.tablename === 'listings' && target.cmd === 'UPDATE'));
  assert.equal(selectedMfa.length, 4);
  for (const target of selectedMfa) {
    await db.exec(`alter policy ${quoteIdentifier(target.policyname)} on public.${quoteIdentifier(target.tablename)}
      ${target.new_using ? `using (${target.new_using})` : ''}
      ${target.new_check ? `with check (${target.new_check})` : ''};`);
  }
  await db.exec(migration('_social_safety_foundation.sql'));
  await db.exec(migration('_enforce_social_block_boundaries.sql'));
  await db.exec(migration('_harden_notifications_owner_policy.sql'));
  await db.exec(migration('_restrict_notifications_table_grants.sql'));
  await db.exec(migration('_notification_preferences.sql'));
  await db.exec(`
    insert into public.listings(id,user_id,status,publication_status,source_type,ownership_status)
      values('${listingId}','${seller}','approved','published','native','claimed'),
      ('${otherListing}','${outsider}','approved','published','native','claimed'),
      ('${externalListing}',null,'approved','published','external_indexed','unclaimed');
    insert into public.messages(id,listing_id,sender_user_id,recipient_user_id,body,created_at)
      values('${incoming}','${listingId}','${buyer}','${seller}','Synthetic buyer message','2026-09-16T12:00:00Z'),
      ('${reply}','${listingId}','${seller}','${buyer}','Synthetic seller reply','2026-09-16T12:01:00Z');
    insert into public.notifications(id,user_id,type,title,payload)
      values('${notificationId}','${seller}','listing_message','Synthetic notification',
        jsonb_build_object('listing_id','${listingId}','sender_user_id','${buyer}'));
    insert into public.reports(id,listing_id,reporter_user_id,reason,details)
      values('${reportId}','${listingId}','${buyer}','message_thread','Synthetic private report');
    insert into public.notification_preferences(user_id,locale,new_messages)
      values('${seller}','ps',false);
  `);

  await verifyHardening();
  await check('buyer and seller can read their conversation; outsider cannot', async () => {
    for (const participant of [buyer, seller]) {
      await actor(participant);
      assert.equal(await count('select count(*)::int n from public.messages'), 2);
    }
    await actor(outsider);
    assert.equal(await count('select count(*)::int n from public.messages'), 0);
  });
  await check('anonymous clients cannot read private messages or reports', async () => {
    await actor(null, 'aal1', 'anon');
    assert.equal(await count('select count(*)::int n from public.messages'), 0);
    assert.equal(await count('select count(*)::int n from public.reports'), 0);
  });
  await check('buyer can send a listing message through actual triggers', async () => {
    await actor(buyer); assert.equal((await insertMessage()).rows.length, 1);
    const [listing] = await rows('select messages_count,status,publication_status,featured,urgent from public.listings where id=$1', [listingId]);
    assert.deepEqual(listing, { messages_count: 3, status: 'approved', publication_status: 'published', featured: false, urgent: false });
  });
  await check('seller can reply on an approved listing through actual triggers', async () => {
    await actor(seller); assert.equal((await insertMessage(seller, buyer)).rows.length, 1);
    assert.equal((await rows('select messages_count from public.listings where id=$1', [listingId]))[0].messages_count, 3);
  });
  await check('senders cannot forge initial read receipts, soft deletion, or chronology', async () => {
    await actor(buyer);
    for (const fields of ["status='read'", "read_at='2000-01-01'", 'deleted_by_recipient=true', 'deleted_by_sender=true']) {
      const [column, value] = fields.split('=');
      await denied(`insert into public.messages(listing_id,sender_user_id,recipient_user_id,body,${column}) values($1,$2,$3,'Synthetic forged initial state',${value})`, [listingId, buyer, seller]);
    }
    const [created] = await rows("insert into public.messages(listing_id,sender_user_id,recipient_user_id,body,created_at) values($1,$2,$3,'Synthetic chronology','2000-01-01') returning created_at=now() stamped,status,read_at", [listingId, buyer, seller]);
    assert.deepEqual(created, { stamped: true, status: 'sent', read_at: null });
  });
  await check('unattributed service-role messages are rejected rather than bypassing integrity', async () => {
    await actor(null, 'aal1', 'service_role');
    await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [listingId, buyer, seller, 'Synthetic service spoof']);
  });
  await check('sender identity cannot be forged by an outsider', async () => {
    await actor(outsider);
    await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [listingId, buyer, seller, 'Synthetic forged sender']);
  });
  await check('messages must include the accountable listing owner', async () => {
    await actor(buyer);
    await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [listingId, buyer, outsider, 'Synthetic unrelated recipient']);
    await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [externalListing, buyer, seller, 'Synthetic unclaimed target']);
  });
  await check('unpublished or non-approved listings reject new messages', async () => {
    await sql("update public.listings set status='expired' where id=$1", [listingId]);
    await actor(buyer);
    await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [listingId, buyer, seller, 'Synthetic expired target']);
  });
  await check('only the recipient can mark an incoming message read', async () => {
    await actor(buyer);
    assert.equal((await rows("update public.messages set status='read',read_at=now() where id=$1 returning id", [incoming])).length, 0);
    await actor(outsider);
    assert.equal((await rows("update public.messages set status='read',read_at=now() where id=$1 returning id", [incoming])).length, 0);
    await actor(seller);
    assert.equal((await rows("update public.messages set status='read',read_at=now() where id=$1 returning id", [incoming])).length, 1);
    const threads = buildMessageThreads(await rows('select * from public.messages order by created_at'), seller);
    assert.equal(threads[0].unreadIncomingCount, 0);
  });
  await check('actual thread helper groups two users and counts only incoming unread messages', async () => {
    for (const [participant, other] of [[buyer, seller], [seller, buyer]]) {
      await actor(participant);
      const threads = buildMessageThreads(await rows('select * from public.messages order by created_at'), participant);
      assert.equal(threads.length, 1); assert.equal(threads[0].participantId, other);
      assert.equal(threads[0].listingId, listingId); assert.equal(threads[0].unreadIncomingCount, 1);
    }
  }, 'sql+pure-helper');
  await check('recipient cannot rewrite message body or sender attribution', async () => {
    await actor(seller);
    await denied('update public.messages set body=$1,sender_user_id=$2 where id=$3', ['Synthetic forged transcript', outsider, incoming]);
  });
  await check('recipient cannot move private transcript to another listing', async () => {
    await actor(seller);
    await denied('update public.messages set listing_id=$1 where id=$2', [otherListing, incoming]);
  });
  await check('recipient can change only read state with server-owned timestamps', async () => {
    await actor(seller);
    for (const assignment of ["id=gen_random_uuid()", `recipient_user_id='${outsider}'`, "created_at='2000-01-01'", 'deleted_by_sender=true', 'deleted_by_recipient=true']) {
      await denied(`update public.messages set ${assignment} where id=$1`, [incoming]);
    }
    let [receipt] = await rows("update public.messages set status='read',read_at='2000-01-01' where id=$1 returning read_at=now() stamped", [incoming]);
    assert.equal(receipt.stamped, true);
    [receipt] = await rows("update public.messages set read_at='2100-01-01' where id=$1 returning read_at=now() stamped", [incoming]);
    assert.equal(receipt.stamped, true);
    [receipt] = await rows("update public.messages set status='sent' where id=$1 returning read_at", [incoming]);
    assert.equal(receipt.read_at, null);
    assert.equal(buildMessageThreads(await rows('select * from public.messages order by created_at'), seller)[0].unreadIncomingCount, 1);
  });
  await check('admin mutation needs AAL2 but participant AAL1 read receipt remains valid', async () => {
    await actor(admin);
    assert.equal((await rows("update public.messages set status='read' where id=$1 returning id", [incoming])).length, 0);
    await actor(admin, 'aal2');
    assert.equal((await rows("update public.messages set status='read' where id=$1 returning id", [incoming])).length, 1);
  });
  await check('block identities are owner-controlled and private to the blocker', async () => {
    await actor(seller);
    await sql('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    assert.equal(await count('select count(*)::int n from public.user_blocks'), 1);
    await actor(buyer);
    assert.equal(await count('select count(*)::int n from public.user_blocks'), 0);
    await denied('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, outsider]);
    assert.equal((await rows('delete from public.user_blocks returning blocker_user_id')).length, 0);
  });
  await check('server trigger blocks messages in both directions despite invisible reverse block', async () => {
    await actor(seller);
    await sql('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    for (const [from, to] of [[buyer, seller], [seller, buyer]]) {
      await actor(from);
      await denied('insert into public.messages(listing_id,sender_user_id,recipient_user_id,body) values($1,$2,$3,$4)', [listingId, from, to, 'Synthetic blocked message']);
    }
  });
  await check('blocked users cannot create follows in either direction', async () => {
    await actor(seller);
    await sql('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    for (const [from, to] of [[buyer, seller], [seller, buyer]]) {
      await actor(from);
      await denied('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [from, to]);
    }
  });
  await check('follow identity, uniqueness, public reads and owner deletion are enforced', async () => {
    await actor(buyer);
    await sql('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [buyer, seller]);
    await denied('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [buyer, seller], '23505');
    await denied('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [seller, buyer]);
    await denied('insert into public.user_follows(follower_user_id,following_user_id) values($1,$1)', [buyer], '23514');
    await actor(null, 'aal1', 'anon');
    assert.equal(await count('select count(*)::int n from public.user_follows'), 1);
    await actor(seller); assert.equal((await rows('delete from public.user_follows returning follower_user_id')).length, 0);
    await actor(buyer); assert.equal((await rows('delete from public.user_follows returning follower_user_id')).length, 1);
  });
  await check('blocking atomically removes only the two affected follow directions', async () => {
    for (const [from, to] of [[buyer, seller], [seller, buyer]]) {
      await actor(from); await sql('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [from, to]);
    }
    await actor(outsider);
    await sql('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [outsider, seller]);
    await actor(seller);
    await sql('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    assert.deepEqual(await rows('select follower_user_id,following_user_id from public.user_follows'), [{ follower_user_id: outsider, following_user_id: seller }]);
  });
  await check('failed block leaves both follow directions intact', async () => {
    for (const [from, to] of [[buyer, seller], [seller, buyer]]) {
      await actor(from); await sql('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [from, to]);
    }
    await actor(outsider);
    await denied('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    assert.equal(await count('select count(*)::int n from public.user_follows'), 2);
    const action = source('lib/actions/social.ts').split('export async function blockUserAction')[1].split('export async function unblockUserAction')[0];
    assert.doesNotMatch(action, /\.from\("user_follows"\)/);
  });
  await check('unblocking restores permitted follow creation without deleting history', async () => {
    await actor(seller);
    await sql('insert into public.user_blocks(blocker_user_id,blocked_user_id) values($1,$2)', [seller, buyer]);
    await sql('delete from public.user_blocks where blocker_user_id=$1 and blocked_user_id=$2', [seller, buyer]);
    await actor(buyer);
    await sql('insert into public.user_follows(follower_user_id,following_user_id) values($1,$2)', [buyer, seller]);
    assert.equal(await count('select count(*)::int n from public.messages'), 2);
  });
  await check('reports are private to their reporter and admins, not the reported seller', async () => {
    await actor(buyer); assert.equal(await count('select count(*)::int n from public.reports'), 1);
    for (const user of [seller, outsider]) { await actor(user); assert.equal(await count('select count(*)::int n from public.reports'), 0); }
    await actor(admin); assert.equal(await count('select count(*)::int n from public.reports'), 1);
  });
  await check('reporter identity cannot be forged and owner cannot resolve reports', async () => {
    await actor(outsider);
    await denied('insert into public.reports(listing_id,reporter_user_id,reason) values($1,$2,$3)', [listingId, buyer, 'Synthetic forged reporter']);
    await actor(buyer);
    assert.equal((await rows("update public.reports set status='actioned' where id=$1 returning id", [reportId])).length, 0);
  });
  await check('report creation cannot forge an administrative resolution', async () => {
    await actor(buyer);
    await denied("insert into public.reports(listing_id,reporter_user_id,reason,status,admin_note,resolved_by,resolved_at) values($1,$2,'synthetic','actioned','Synthetic forged resolution',$3,now())", [listingId, buyer, admin]);
    for (const [field, value] of [['status', "'reviewed'"], ['admin_note', "'forged'"], ['resolved_by', `'${admin}'`], ['resolved_at', 'now()']]) {
      await denied(`insert into public.reports(listing_id,reporter_user_id,reason,${field}) values($1,$2,'synthetic',${value})`, [listingId, buyer]);
    }
  });
  await check('report review is AAL2-gated without preventing new owner reports', async () => {
    await actor(buyer); await sql("insert into public.reports(listing_id,reporter_user_id,reason) values($1,$2,'Synthetic report')", [listingId, buyer]);
    await actor(admin); assert.equal((await rows("update public.reports set status='reviewed' returning id")).length, 0);
    await actor(admin, 'aal2'); assert.equal((await rows("update public.reports set status='reviewed' returning id")).length, 2);
  });
  await check('report chronology and review attribution are server-owned and original evidence immutable', async () => {
    await actor(buyer);
    const [created] = await rows("insert into public.reports(listing_id,reporter_user_id,reason,created_at,updated_at) values($1,$2,'Synthetic report','2000-01-01','2100-01-01') returning created_at=now() created,updated_at=now() updated", [listingId, buyer]);
    assert.deepEqual(created, { created: true, updated: true });
    await actor(admin, 'aal2');
    let [reviewed] = await rows("update public.reports set status='actioned',resolved_by=$1,resolved_at='2000-01-01' where id=$2 returning resolved_by,resolved_at=now() stamped", [outsider, reportId]);
    assert.deepEqual(reviewed, { resolved_by: admin, stamped: true });
    for (const assignment of ["id=gen_random_uuid()", `listing_id='${otherListing}'`, `reporter_user_id='${outsider}'`, "reason='rewritten'", "details='rewritten'", "created_at='2000-01-01'"]) {
      await denied(`update public.reports set ${assignment} where id=$1`, [reportId]);
    }
    [reviewed] = await rows("update public.reports set status='open' where id=$1 returning resolved_by,resolved_at", [reportId]);
    assert.deepEqual(reviewed, { resolved_by: null, resolved_at: null });
  });
  await check('notifications expose only the recipient row and cannot be reassigned', async () => {
    for (const user of [buyer, outsider]) { await actor(user); assert.equal(await count('select count(*)::int n from public.notifications'), 0); }
    await actor(seller); assert.equal(await count('select count(*)::int n from public.notifications'), 1);
    await denied('update public.notifications set user_id=$1 where id=$2', [buyer, notificationId]);
    await actor(null, 'aal1', 'anon'); await denied('select * from public.notifications');
  });
  await check('notifications are service-created and recipient-only read receipts reduce unread count', async () => {
    await actor(buyer);
    await denied("insert into public.notifications(user_id,type,title) values($1,'system','Synthetic forgery')", [seller]);
    assert.equal((await rows('update public.notifications set is_read=true,read_at=now() where id=$1 returning id', [notificationId])).length, 0);
    await actor(seller);
    assert.equal(await count('select count(*)::int n from public.notifications where is_read=false'), 1);
    await sql('update public.notifications set is_read=true,read_at=now() where id=$1', [notificationId]);
    assert.equal(await count('select count(*)::int n from public.notifications where is_read=false'), 0);
    await denied('delete from public.notifications where id=$1', [notificationId]);
    await actor(null, 'aal1', 'service_role');
    await sql("insert into public.notifications(user_id,type,title) values($1,'system','Synthetic service event')", [buyer]);
  });
  await check('notification preference privacy preserves recipient opt-out', async () => {
    await actor(buyer); assert.equal(await count('select count(*)::int n from public.notification_preferences'), 0);
    await actor(seller); assert.equal((await rows('select new_messages from public.notification_preferences'))[0].new_messages, false);
    await denied('update public.notification_preferences set user_id=$1', [buyer]);
  });
  await check('actual notification links preserve safe message/follow/listing context', async () => {
    await actor(seller);
    const [{ payload }] = await rows('select payload from public.notifications where id=$1', [notificationId]);
    assert.equal(notificationDestination(payload), `/dashboard/messages?listing=${listingId}&participant=${buyer}`);
    assert.equal(notificationDestination({ follower_user_id: buyer }), `/sellers/${buyer}`);
    assert.equal(notificationDestination({ listing_id: listingId }), `/listings/${listingId}`);
    assert.equal(notificationDestination({ offer_id: 'synthetic-offer' }), '/dashboard/offers');
    assert.equal(notificationDestination({ follower_user_id: '//outside.invalid/a?x=1' }), '/sellers/%2F%2Foutside.invalid%2Fa%3Fx%3D1');
    assert.equal(notificationDestination(null), '/dashboard/notifications');
  }, 'sql+pure-helper');
  await check('application emits contextual notifications only after successful message/follow writes', async () => {
    const actions = source('lib/actions/messages.ts');
    assert.match(actions, /if \(error\) \{[\s\S]*?redirect[\s\S]*?createAccountNotification/);
    assert.match(actions, /if \(error\) return;\s*await createAccountNotification/);
    assert.match(actions, /type: "listing_message"/);
    assert.match(actions, /payload: \{ listing_id: listingId, sender_user_id: user\.id \}/);
    assert.match(actions, /preference: "new_messages"/);
    assert.match(source('lib/actions/social.ts'), /if \(!error\) \{\s*await createAccountNotification/);
    assert.match(source('lib/notifications/create.ts'), /if \(preference && preferences\?\.\[preference\] === false\) return true/);
    assert.match(source('lib/notifications/create.ts'), /copy\[locale\]/);
  }, 'source-contract');
  await check('notification event subscription and open action remain account-scoped', async () => {
    const header = source('components/auth-aware-header-actions.tsx');
    assert.match(header, /"postgres_changes", \{ event: "\*", schema: "public", table: "notifications", filter: `user_id=eq\.\$\{data\.user\.id\}`/);
    const actions = source('lib/actions/notifications.ts');
    assert.match(actions, /\.eq\("id", id\)\s*\.eq\("user_id", user\.id\)\s*\.maybeSingle\(\)/);
    assert.match(actions, /redirect\(localizePath\(notificationDestination\(notification\.payload\), locale\)\)/);
    const reports = source('lib/actions/reports.ts');
    assert.match(reports, /if \(!outgoingThread\.data && !incomingThread\.data\) \{\s*return;/);
  }, 'source-contract');

  const failed = results.filter((result) => !result.passed);
  console.log(JSON.stringify({
    harness: 'isolated-social-interaction-safety',
    passed: results.length - failed.length,
    failed: failed.length,
    failures: failed,
    loadedMigrations: [...loadedMigrations],
    limits: ['Synthetic auth/admin fixtures and baseline grants', 'Minimal surrounding listing schema', 'No production schema attestation', 'No browser, Next.js action runtime, provider, or Realtime delivery', 'Single-connection: no concurrency proof'],
  }, null, 2));
  if (failed.length) process.exitCode = 1;
} finally {
  await db.close();
}

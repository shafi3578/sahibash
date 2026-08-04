#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
});

async function bootstrapAdmins() {
  const { data: role, error: roleError } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('name', 'super_administrator')
    .single();

  if (roleError || !role) {
    throw new Error(`Unable to find super_administrator role: ${roleError?.message ?? 'not found'}`);
  }

  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminsError) {
    throw new Error(`Unable to load admin profiles: ${adminsError.message}`);
  }

  const rows = (admins ?? []).map((admin) => ({
    user_id: admin.id,
    role_id: role.id,
  }));

  if (rows.length === 0) {
    console.log('ℹ️ No profiles currently flagged as admin; nothing to bootstrap.');
    return;
  }

  const { error } = await supabase
    .from('admin_user_roles')
    .upsert(rows, { onConflict: 'user_id,role_id' });

  if (error) {
    throw new Error(`Unable to assign RBAC roles: ${error.message}`);
  }

  console.log(`✅ Assigned super_administrator role to ${rows.length} existing admin profile(s).`);
}

bootstrapAdmins().catch((error) => {
  console.error('💥 RBAC bootstrap failed:', error.message);
  process.exit(1);
});

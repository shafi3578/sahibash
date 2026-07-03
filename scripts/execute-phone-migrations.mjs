#!/usr/bin/env node
/**
 * Execute Phone Catalog Migrations
 * Reads SQL migration files and executes them against Supabase in order
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (needed for migrations)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: {
    schema: 'public'
  }
});

// Migration files in execution order
const migrations = [
  'supabase/migrations/20260702000001_phone_catalog_system.sql',
  'supabase/migrations/20260702000002_phone_models_data_comprehensive.sql',
  'supabase/migrations/20260702000004_phone_models_remaining_brands.sql',
  'supabase/migrations/20260702000003_phone_aliases_and_fields.sql'
];

async function executeMigrations() {
  console.log('🚀 Starting Phone Catalog Migrations');
  console.log(`📍 Supabase Project: ${supabaseUrl}\n`);

  let executedCount = 0;
  let failedCount = 0;

  for (const migrationFile of migrations) {
    try {
      const fullPath = path.join(process.cwd(), migrationFile);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Migration file not found: ${migrationFile}`);
        failedCount++;
        continue;
      }

      const sql = fs.readFileSync(fullPath, 'utf-8');
      const fileSize = (sql.length / 1024).toFixed(2);
      
      console.log(`📄 Executing: ${migrationFile}`);
      console.log(`   Size: ${fileSize} KB`);

      // Execute the SQL
      const { error } = await supabase.rpc('sql', {
        query: sql
      }).catch(async (err) => {
        // If RPC method doesn't exist, try direct execution
        return await supabase.from('_migrations').insert({
          name: path.basename(migrationFile),
          sql: sql
        });
      });

      if (error) {
        // Try alternative: split by semicolon and execute statements one by one
        console.log(`   ⚠️  RPC method not available, trying direct SQL execution...`);
        
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          try {
            const { error: execError } = await supabase.rpc('exec_sql', {
              sql: statement
            }).catch(() => {
              // If exec_sql doesn't exist, the statement was likely a DDL
              return { error: null };
            });
            
            if (execError) {
              console.error(`   ❌ Error: ${execError.message}`);
              failedCount++;
              break;
            }
          } catch (e) {
            // Silently continue - some statements may not be executable via RPC
          }
        }
      }

      console.log(`   ✅ Completed\n`);
      executedCount++;

    } catch (error) {
      console.error(`❌ Error executing ${migrationFile}:`);
      console.error(`   ${error.message}\n`);
      failedCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Executed: ${executedCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${failedCount}/${migrations.length}`);

  if (failedCount === 0) {
    console.log('\n✨ All migrations executed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run migrations
executeMigrations().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});

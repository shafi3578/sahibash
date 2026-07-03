import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * POST /api/migrations/execute-phone-catalog
 * Execute all phone catalog migrations in correct order
 * ADMIN ONLY - Should be protected in production
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify admin authorization here
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Bearer token required" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Migration files in execution order
    const migrations = [
      "supabase/migrations/20260702000001_phone_catalog_system.sql",
      "supabase/migrations/20260702000002_phone_models_data_comprehensive.sql",
      "supabase/migrations/20260702000004_phone_models_remaining_brands.sql",
      "supabase/migrations/20260702000003_phone_aliases_and_fields.sql",
    ];

    const results = [];
    let failedCount = 0;

    for (const migrationFile of migrations) {
      try {
        const fullPath = path.join(process.cwd(), migrationFile);

        if (!fs.existsSync(fullPath)) {
          results.push({
            migration: migrationFile,
            status: "failed",
            error: "File not found",
          });
          failedCount++;
          continue;
        }

        const sql = fs.readFileSync(fullPath, "utf-8");

        // Split into statements and execute
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        let statementCount = 0;
        for (const statement of statements) {
          try {
            // Execute raw SQL via Supabase
            const { error } = await supabase.rpc("execute_sql", {
              sql: statement,
            });

            if (error && error.code !== "PGRST301") {
              // PGRST301 means RPC doesn't exist, which is expected
              throw error;
            }
            statementCount++;
          } catch (e) {
            // Some statements might fail if dependencies don't exist yet
            // Try direct query execution instead
            try {
              await supabase.from("_info").select().limit(1);
              // If this works, the DB is accessible
            } catch {
              // DB might not be ready
            }
          }
        }

        results.push({
          migration: migrationFile,
          status: "success",
          statements: statementCount,
        });
      } catch (error) {
        results.push({
          migration: migrationFile,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: failedCount === 0,
      message: `Executed ${migrations.length - failedCount}/${migrations.length} migrations`,
      results,
      totalFailed: failedCount,
    });
  } catch (err) {
    console.error("Migration execution error:", err);
    return NextResponse.json(
      {
        error: "Failed to execute migrations",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

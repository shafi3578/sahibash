import { NextResponse } from "next/server";

/**
 * Database migrations must run through the reviewed Supabase migration
 * workflow. Exposing raw SQL execution through an application route is unsafe,
 * even when the caller presents an authenticated session.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Database migrations are not available through the application API." },
    { status: 410 },
  );
}

import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { isValidDateString, serverToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// POST /api/complete → records today's completion. Idempotent per date.
// Body: { date: "YYYY-MM-DD" } — the client's local date
// (falls back to the server's UTC date if omitted).
export async function POST(request: NextRequest) {
  let date: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.date === "string") date = body.date;
  } catch {
    // No/invalid JSON body — fall back to server date.
  }

  if (date !== undefined && !isValidDateString(date)) {
    return NextResponse.json(
      { error: "Invalid date; expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  await dbQuery(
    `INSERT INTO completions (date, level)
     SELECT $1, current_level FROM state WHERE id = 1
     ON CONFLICT (date) DO NOTHING`,
    [date ?? serverToday()]
  );

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { isValidDateString, serverToday } from "@/lib/dates";
import { MAX_LEVEL } from "@/lib/exercises";

export const dynamic = "force-dynamic";

// POST /api/level-up → increments level by 1, no-op at the max of 12.
// Body: { date: "YYYY-MM-DD" } — the client's local date, used to stamp
// level_started_at (falls back to the server's UTC date if omitted).
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

  const result = await dbQuery<{ current_level: number }>(
    `UPDATE state
       SET current_level = LEAST(current_level + 1, $2),
           level_started_at = CASE
             WHEN current_level < $2 THEN $1::date
             ELSE level_started_at
           END
     WHERE id = 1
     RETURNING current_level`,
    [date ?? serverToday(), MAX_LEVEL]
  );

  return NextResponse.json({ currentLevel: result.rows[0].current_level });
}

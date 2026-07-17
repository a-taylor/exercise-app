import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { isValidDateString, serverToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// POST /api/level-down → decrements level by 1, no-op at the floor of 1.
// Completions logged at the old level are retagged to the new level so
// history is preserved; level_started_at resets to the given date.
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
    `WITH old AS (
       SELECT current_level FROM state WHERE id = 1
     ),
     updated AS (
       UPDATE state
          SET current_level = GREATEST(current_level - 1, 1),
              level_started_at = CASE
                WHEN current_level > 1 THEN $1::date
                ELSE level_started_at
              END
        WHERE id = 1
       RETURNING current_level
     ),
     retag AS (
       UPDATE completions
          SET level = (SELECT current_level FROM updated)
        WHERE level = (SELECT current_level FROM old)
          AND (SELECT current_level FROM old) > (SELECT current_level FROM updated)
       RETURNING 1
     )
     SELECT current_level FROM updated`,
    [date ?? serverToday()]
  );

  return NextResponse.json({ currentLevel: result.rows[0].current_level });
}

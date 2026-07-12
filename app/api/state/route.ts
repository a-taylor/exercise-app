import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { isValidDateString, serverToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// GET /api/state → { currentLevel, completedToday }
// "Today" is the client's local date, passed as ?date=YYYY-MM-DD
// (falls back to the server's UTC date if omitted).
export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (dateParam !== null && !isValidDateString(dateParam)) {
    return NextResponse.json(
      { error: "Invalid date; expected YYYY-MM-DD" },
      { status: 400 }
    );
  }
  const date = dateParam ?? serverToday();

  const [stateResult, completionResult] = await Promise.all([
    dbQuery<{
      current_level: number;
      completions_at_level: number;
      days_at_level: number;
    }>(
      `SELECT s.current_level,
              (SELECT COUNT(*) FROM completions c
                WHERE c.level = s.current_level) AS completions_at_level,
              ($1::date - s.level_started_at + 1) AS days_at_level
         FROM state s
        WHERE s.id = 1`,
      [date]
    ),
    dbQuery<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM completions WHERE date = $1) AS exists",
      [date]
    ),
  ]);

  const row = stateResult.rows[0];
  return NextResponse.json({
    currentLevel: row.current_level,
    completedToday: completionResult.rows[0].exists,
    completionsAtLevel: Number(row.completions_at_level),
    daysAtLevel: Number(row.days_at_level),
  });
}

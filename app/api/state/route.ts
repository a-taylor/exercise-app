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
    dbQuery<{ current_level: number }>(
      "SELECT current_level FROM state WHERE id = 1"
    ),
    dbQuery<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM completions WHERE date = $1) AS exists",
      [date]
    ),
  ]);

  return NextResponse.json({
    currentLevel: stateResult.rows[0].current_level,
    completedToday: completionResult.rows[0].exists,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { isValidDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";

// GET /api/history?start=YYYY-MM-DD&end=YYYY-MM-DD
// → { completed: ["YYYY-MM-DD", ...] } — the completed days within the range.
// The client supplies the range (its local 4-week window); this just reports
// which of those days were done. TO_CHAR keeps the output a clean string
// regardless of the driver's DATE handling.
export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (
    start === null ||
    end === null ||
    !isValidDateString(start) ||
    !isValidDateString(end)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid start/end; expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const result = await dbQuery<{ date: string }>(
    `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date
       FROM completions
      WHERE date BETWEEN $1 AND $2`,
    [start, end]
  );

  return NextResponse.json({ completed: result.rows.map((r) => r.date) });
}

import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { MAX_LEVEL } from "@/lib/exercises";

export const dynamic = "force-dynamic";

// POST /api/level-up → increments level by 1, no-op at the max of 12.
export async function POST() {
  const result = await dbQuery<{ current_level: number }>(
    `UPDATE state
       SET current_level = LEAST(current_level + 1, $1),
           level_started_at = CASE
             WHEN current_level < $1 THEN current_date
             ELSE level_started_at
           END
     WHERE id = 1
     RETURNING current_level`,
    [MAX_LEVEL]
  );

  return NextResponse.json({ currentLevel: result.rows[0].current_level });
}

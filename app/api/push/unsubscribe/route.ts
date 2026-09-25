import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/push/unsubscribe → forgets a push subscription.
// Body: { endpoint }
export async function POST(request: NextRequest) {
  let endpoint: unknown;
  try {
    endpoint = (await request.json())?.endpoint;
  } catch {
    endpoint = undefined;
  }

  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await dbQuery(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [
    endpoint,
  ]);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { dbQuery } from "@/lib/db";
import { dueReminder, londonNow } from "@/lib/reminders";

export const dynamic = "force-dynamic";

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// GET /api/cron/reminder → sends a push reminder if a reminder time has passed
// (UK local time) and today isn't logged yet. Called by Vercel Cron; requires
// `Authorization: Bearer $CRON_SECRET`. Safe to call at any frequency — each
// reminder time is sent at most once per day.
//
// `?test=1` skips the time/completion/once-a-day checks and sends a test push
// straight away, for checking the setup end to end.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const test = request.nextUrl.searchParams.get("test") === "1";
  const { date, time } = londonNow();
  const slot = test ? null : dueReminder(time);

  if (!test) {
    if (!slot) return NextResponse.json({ sent: 0, reason: "not yet due", date, time });

    const done = await dbQuery(`SELECT 1 FROM completions WHERE date = $1`, [date]);
    if (done.rows.length) {
      return NextResponse.json({ sent: 0, reason: "already done today", date, time });
    }

    // Claim the slot first so overlapping/duplicate cron runs can't double-send.
    const claimed = await dbQuery(
      `INSERT INTO reminders_sent (date, slot) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING slot`,
      [date, slot]
    );
    if (!claimed.rows.length) {
      return NextResponse.json({ sent: 0, reason: "already reminded", date, time });
    }
  }

  const { rows: subs } = await dbQuery<SubscriptionRow>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions`
  );

  const payload = JSON.stringify(
    test
      ? { title: "Test reminder", body: "Push notifications are working." }
      : { title: "Time to exercise", body: "You haven't done today's routine yet." }
  );

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      // 404/410: the subscription has expired or been revoked — drop it.
      if (status === 404 || status === 410) {
        await dbQuery(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [
          sub.endpoint,
        ]);
      } else {
        console.error("Push send failed", status, err);
      }
    }
  }

  // Nothing got through — release the slot so a later cron run can retry.
  if (!test && sent === 0) {
    await dbQuery(`DELETE FROM reminders_sent WHERE date = $1 AND slot = $2`, [
      date,
      slot,
    ]);
  }

  return NextResponse.json({ sent, subscriptions: subs.length, date, time, slot });
}

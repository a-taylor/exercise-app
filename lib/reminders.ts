// Reminder schedule and UK-local time for the reminder cron.
//
// Vercel cron schedules are UTC-only, so the cron just wakes the route up and
// this decides — in Europe/London time, which tracks the BST/GMT switch —
// whether a reminder is due. The route is safe to call at any frequency.

// Local (Europe/London) times a reminder goes out if today isn't logged yet.
// Each time needs two UTC cron entries in vercel.json (one per BST/GMT offset).
export const REMINDER_TIMES = ["18:00"];

const TIME_ZONE = "Europe/London";

// The current London date (YYYY-MM-DD) and time of day (HH:MM).
export function londonNow(now: Date = new Date()): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

// The latest reminder time that has passed, or null if none has yet today.
// (Zero-padded HH:MM strings compare correctly as strings.)
export function dueReminder(time: string): string | null {
  const passed = REMINDER_TIMES.filter((t) => t <= time).sort();
  return passed.length ? passed[passed.length - 1] : null;
}

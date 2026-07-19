// Builds the 4-week (28-day) weekday-aligned window for the history view.
// Weeks start on Monday; the current week is the bottom row, with the three
// preceding weeks above it. Dates are plain YYYY-MM-DD and all arithmetic is
// done in UTC so it never shifts across timezones.

export interface DayCell {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isToday: boolean;
  inFuture: boolean; // after today — shown greyed, never markable
}

export interface FourWeekWindow {
  cells: DayCell[]; // 28 cells, Monday→Sunday, oldest week first
  start: string; // first cell's date (inclusive)
  end: string; // last cell's date (inclusive)
}

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function format(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

// Days since the most recent Monday (Monday → 0, Sunday → 6).
function mondayOffset(dt: Date): number {
  return (dt.getUTCDay() + 6) % 7;
}

export function fourWeekWindow(today: string): FourWeekWindow {
  const t = parse(today);

  // Monday of the current week, then rewind three weeks to the grid start.
  const start = parse(today);
  start.setUTCDate(t.getUTCDate() - mondayOffset(t) - 21);

  const cells: DayCell[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const date = format(d);
    cells.push({
      date,
      dayOfMonth: d.getUTCDate(),
      isToday: date === today,
      inFuture: date > today,
    });
  }

  return { cells, start: cells[0].date, end: cells[27].date };
}

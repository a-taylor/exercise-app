// Builds the trailing 28-day window for the history view: today and the 27
// days before it, so it always covers a full 4 weeks of history — never
// padded with future dates. The grid still lines up under Monday→Sunday
// weekday headers, so `leadingPad` gives the number of blank cells to render
// before the first real day (e.g. if the window starts on a Tuesday, pad 1
// so it falls under the "T" column). Dates are plain YYYY-MM-DD and all
// arithmetic is done in UTC so it never shifts across timezones.

export interface DayCell {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isToday: boolean;
}

export interface FourWeekWindow {
  cells: DayCell[]; // 28 cells, oldest day first, ending today
  leadingPad: number; // blank grid cells to prepend for weekday alignment
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

  // 27 days before today, so the window is exactly 28 days ending today.
  const start = parse(today);
  start.setUTCDate(t.getUTCDate() - 27);

  const cells: DayCell[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const date = format(d);
    cells.push({
      date,
      dayOfMonth: d.getUTCDate(),
      isToday: date === today,
    });
  }

  return {
    cells,
    leadingPad: mondayOffset(start),
    start: cells[0].date,
    end: cells[27].date,
  };
}

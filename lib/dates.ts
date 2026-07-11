const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

// Server-side fallback when the client doesn't supply a date (UTC).
export function serverToday(): string {
  return new Date().toISOString().slice(0, 10);
}

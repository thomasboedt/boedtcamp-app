// Local-day ISO date helpers ("YYYY-MM-DD"), used to group nutrition entries
// by the client's calendar day regardless of time-of-day or timezone offset.

export function isoOf(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function isoToday(): string {
  return isoOf(new Date());
}

export function isoAdd(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

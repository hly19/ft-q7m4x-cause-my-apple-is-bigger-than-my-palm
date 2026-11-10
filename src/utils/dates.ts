// Local-time date helpers. The `date` field is always the device's local day, never UTC.

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD for the given moment in local time. */
export function toLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** HH:mm for the given moment in local time. */
export function toLocalTime(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const today = () => toLocalDate();
export const nowTime = () => toLocalTime();

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = parseLocalDate(s);
  return toLocalDate(d) === s;
}

/** Parse YYYY-MM-DD as local midnight (new Date('YYYY-MM-DD') would be UTC). */
export function parseLocalDate(s: string): Date {
  const m = DATE_RE.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Add whole calendar days. DST-safe because it works on calendar fields. */
export function addDays(s: string, n: number): string {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + n);
  return toLocalDate(d);
}

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a));
  return Math.round(ms / 86_400_000);
}

function ymd(s: string): [number, number, number] {
  const d = parseLocalDate(s);
  return [d.getFullYear(), d.getMonth(), d.getDate()];
}

/** "Today", "Yesterday", "Tomorrow" or e.g. "Mon 3 Nov". */
export function dayLabel(s: string, ref: string = today()): string {
  const diff = daysBetween(ref, s);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  const d = parseLocalDate(s);
  const sameYear = d.getFullYear() === parseLocalDate(ref).getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

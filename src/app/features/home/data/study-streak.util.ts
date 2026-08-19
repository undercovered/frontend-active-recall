/** Local calendar day (YYYY-MM-DD), not UTC. */
export function localYmd(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Bucket attempt timestamps by the learner's local calendar day. */
export function bucketAttemptsByLocalDay(attempts: string[]): Record<string, number> {
  const days: Record<string, number> = {};
  for (const iso of attempts) {
    const key = localYmd(new Date(iso));
    if (!key) continue;
    days[key] = (days[key] ?? 0) + 1;
  }
  return days;
}

/** Coerce API day maps whose keys may be ISO timestamps or Date strings. */
export function normalizeDayCounts(
  days: Record<string, number> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(days ?? {})) {
    const n = Number(count);
    if (!n) continue;
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : localYmd(new Date(key));
    if (!iso) continue;
    out[iso] = (out[iso] ?? 0) + n;
  }
  return out;
}

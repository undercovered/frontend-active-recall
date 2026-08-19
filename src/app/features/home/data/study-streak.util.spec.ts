import { bucketAttemptsByLocalDay, localYmd, normalizeDayCounts } from './study-streak.util';

describe('study-streak.util', () => {
  it('formats a local calendar day', () => {
    expect(localYmd(new Date(2026, 7, 18, 22, 47))).toBe('2026-08-18');
  });

  it('returns empty for an invalid date', () => {
    expect(localYmd(new Date('nope'))).toBe('');
  });

  it('counts each attempt on its local day', () => {
    const days = bucketAttemptsByLocalDay([
      '2026-08-18T22:00:00.000Z',
      '2026-08-18T23:00:00.000Z',
    ]);
    const keys = Object.keys(days);
    expect(keys).toHaveLength(1);
    expect(days[keys[0]]).toBe(2);
  });

  it('keeps YYYY-MM-DD keys when normalizing counts', () => {
    expect(normalizeDayCounts({ '2026-08-18': 2 })).toEqual({ '2026-08-18': 2 });
  });
});

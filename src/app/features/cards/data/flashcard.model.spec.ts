import { REVIEW_INTERVALS_DAYS } from './flashcard.model';

describe('REVIEW_INTERVALS_DAYS', () => {
  it('is a strictly increasing 6-step schedule', () => {
    expect([...REVIEW_INTERVALS_DAYS]).toEqual([1, 3, 7, 15, 30, 60]);
    for (let i = 1; i < REVIEW_INTERVALS_DAYS.length; i++) {
      expect(REVIEW_INTERVALS_DAYS[i]).toBeGreaterThan(REVIEW_INTERVALS_DAYS[i - 1]);
    }
  });
});

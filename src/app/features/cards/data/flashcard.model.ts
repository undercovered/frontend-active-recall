export interface Flashcard {
  id: string;
  question: string;
  topicId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateFlashcard = Pick<Flashcard, 'question' | 'topicId'>;
export type UpdateFlashcard = Partial<Pick<Flashcard, 'question'>>;

/**
 * Fixed interval schedule (in days) for the simple spaced-repetition strategy.
 * Kept here for the future review engine; the backend will own the scheduling
 * logic once those columns are added to the `flashcards` table.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 15, 30, 60] as const;

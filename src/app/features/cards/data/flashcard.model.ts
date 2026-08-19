import {
  AnswerType,
  AnswerTypeCode,
  TopicAnswer,
} from '../../topics/data/topic.model';

export interface Flashcard {
  id: string;
  question: string;
  topicId: string;
  subjectId: string;
  topicTitle?: string;
  subjectTitle?: string;
  answerTypeId: string;
  answerType?: AnswerType | null;
  answers: TopicAnswer[];
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFlashcard {
  topicId: string;
  question: string;
  answerTypeCode: AnswerTypeCode;
  answers: { answerText: string; isCorrect: boolean }[];
}

export type UpdateFlashcard = Partial<
  Pick<CreateFlashcard, 'question' | 'answerTypeCode' | 'answers'>
>;

/**
 * Fixed interval schedule (in days) for the simple spaced-repetition strategy.
 * Kept here for the future review engine; the backend will own the scheduling
 * logic once those columns are added to the `flashcards` table.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 15, 30, 60] as const;

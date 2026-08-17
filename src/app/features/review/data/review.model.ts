import { AnswerTypeCode } from '../../topics/data/topic.model';

export interface DueToday {
  date: string;
  hasPending: boolean;
  count: number;
  topicCount: number;
}

export type ReviewCardState = 'pending' | 'awaiting_grade' | 'graded';

export interface ReviewOption {
  id: string;
  answerText: string;
}

export interface ReviewFlashcard {
  id: string;
  question: string;
  answerTypeCode: AnswerTypeCode;
  options: ReviewOption[];
  state: ReviewCardState;
  isCorrect: boolean | null;
  selectedAnswerIds: string[];
  openResponse: string | null;
  expectedText: string | null;
}

export interface ReviewTopic {
  id: string;
  title: string;
  recallId: string;
  dateRecall: string;
  flashcards: ReviewFlashcard[];
}

export interface ReviewSubject {
  id: string;
  title: string;
  topics: ReviewTopic[];
}

export interface ReviewSession {
  date: string;
  hasPending: boolean;
  subjects: ReviewSubject[];
}

export interface ReviewAnswerResult {
  flashcardId: string;
  status: ReviewCardState;
  isCorrect: boolean | null;
  expectedText?: string;
  openResponse?: string;
  selectedAnswerIds?: string[];
  correctAnswerIds?: string[];
}

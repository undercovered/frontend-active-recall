export interface Topic {
  id: string;
  title: string;
  description?: string | null;
  subjectId: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  flashcard?: TopicFlashcard | null;
  flashcards?: TopicFlashcard[];
  recalls?: TopicRecall[];
}

export interface TopicFlashcard {
  id: string;
  question: string;
  topicId: string;
  answerTypeId: string;
  answerType?: AnswerType;
  answers: TopicAnswer[];
  deleted?: boolean;
}

export interface TopicAnswer {
  id?: string;
  answerText: string;
  isCorrect: boolean;
  deleted?: boolean;
}

export interface TopicRecall {
  id: string;
  dateRecall: string;
  correctAnswer: boolean | null;
  topicId: string;
  deleted?: boolean;
}

export interface AnswerType {
  id: string;
  code: AnswerTypeCode;
  name: string;
  deleted?: boolean;
}

export type AnswerTypeCode =
  | 'single_choice'
  | 'multiple_choice'
  | 'open_answer';

export interface CreateTopicQuestion {
  question: string;
  answerTypeCode: AnswerTypeCode;
  answers: { answerText: string; isCorrect: boolean }[];
}

export interface CreateTopic {
  title: string;
  description?: string | null;
  subjectId: string;
  questions: CreateTopicQuestion[];
}

export type UpdateTopic = Partial<Pick<Topic, 'title' | 'description'>>;

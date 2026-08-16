export interface Topic {
  id: string;
  title: string;
  description?: string | null;
  subjectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTopic = Pick<Topic, 'title' | 'description' | 'subjectId'>;
export type UpdateTopic = Partial<Pick<Topic, 'title' | 'description'>>;

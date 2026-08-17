export interface Subject {
  id: string;
  title: string;
  description?: string | null;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSubject = Pick<Subject, 'title' | 'description'>;
export type UpdateSubject = Partial<CreateSubject>;

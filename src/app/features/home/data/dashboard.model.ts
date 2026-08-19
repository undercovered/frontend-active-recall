export interface DashboardSubjectStats {
  id: string;
  dueToday: number;
  inProgress: number;
}

export interface DashboardStats {
  date: string;
  dueToday: number;
  topicCount: number;
  retentionRate: number | null;
  subjects: DashboardSubjectStats[];
}

export interface StudyStreak {
  startedAt: string;
  today: string;
  days: Record<string, number>;
}

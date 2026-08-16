import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        title: 'Inicio · Active Recall',
        loadComponent: () =>
          import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'subjects',
        title: 'Materias · Active Recall',
        loadComponent: () =>
          import('./features/subjects/pages/subjects-page').then(
            (m) => m.SubjectsPage,
          ),
      },
      {
        path: 'topics',
        title: 'Temas · Active Recall',
        loadComponent: () =>
          import('./features/topics/pages/topics-page').then(
            (m) => m.TopicsPage,
          ),
      },
      {
        path: 'cards',
        title: 'Preguntas · Active Recall',
        loadComponent: () =>
          import('./features/cards/pages/cards-page').then((m) => m.CardsPage),
      },
      {
        path: 'review',
        title: 'Repasar · Active Recall',
        loadComponent: () =>
          import('./features/review/pages/review-page').then(
            (m) => m.ReviewPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

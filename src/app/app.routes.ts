import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Active Recall',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
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
        path: 'subjects/:id/topics',
        title: 'Temas de la materia · Active Recall',
        loadComponent: () =>
          import('./features/topics/pages/subject-topics-page').then(
            (m) => m.SubjectTopicsPage,
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

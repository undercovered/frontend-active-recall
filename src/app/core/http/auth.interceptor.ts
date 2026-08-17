import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const withAuth = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(withAuth).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const code =
          err.error && typeof err.error === 'object'
            ? (err.error as { code?: string }).code
            : undefined;
        const sessionDead =
          err.status === 401 ||
          code === 'AUTH_USER_DISABLED' ||
          code === 'AUTH_USER_NOT_FOUND';
        const url = withAuth.url;
        const isAuthCall =
          url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/password-reset') ||
          (withAuth.method === 'POST' && url.includes('/users'));
        if (sessionDead && !isAuthCall) {
          auth.clear();
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => err);
    }),
  );
};

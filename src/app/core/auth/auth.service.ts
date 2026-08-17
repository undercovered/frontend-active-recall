import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth.api';
import { AuthUser, LoginRequest, RegisterRequest } from './auth.model';

const TOKEN_KEY = 'active-recall-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<AuthUser | null>(null);
  private restoreAttempt: Promise<boolean> | null = null;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this._token() && this._user()));

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Validates a stored token against GET /auth/me. Safe to call multiple times. */
  ensureSession(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return Promise.resolve(true);
    }
    const token = this._token();
    if (!token) {
      return Promise.resolve(false);
    }
    if (!this.restoreAttempt) {
      this.restoreAttempt = firstValueFrom(this.api.me())
        .then((user) => {
          this._user.set(user);
          return true;
        })
        .catch(() => {
          this.clear();
          return false;
        })
        .finally(() => {
          this.restoreAttempt = null;
        });
    }
    return this.restoreAttempt;
  }

  async login(input: LoginRequest): Promise<AuthUser> {
    const result = await firstValueFrom(this.api.login(input));
    this.persist(result.token, result.user);
    return result.user;
  }

  async register(input: RegisterRequest): Promise<AuthUser> {
    return firstValueFrom(this.api.register(input));
  }

  logout(): void {
    this.clear();
    void this.router.navigateByUrl('/login');
  }

  clear(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  }

  private persist(token: string, user: AuthUser): void {
    this._token.set(token);
    this._user.set(user);
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* session still lives in memory for this tab */
    }
  }
}

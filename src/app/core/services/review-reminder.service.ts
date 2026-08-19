import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ReviewsApi } from '../../features/review/data/reviews.api';
import { DueToday } from '../../features/review/data/review.model';
import { AuthService } from '../auth/auth.service';

const REMIND_EVERY_MS = 10 * 60 * 1000;

/**
 * Client-side "cron": on app open, asks the backend if there are reviews
 * due today. If there are none, it does nothing. If there are, it shows
 * an alert — except on the review page itself.
 */
@Injectable({ providedIn: 'root' })
export class ReviewReminderService {
  private readonly api = inject(ReviewsApi);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly visible = signal(false);
  readonly due = signal<DueToday | null>(null);

  private reminderTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  init(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isReviewUrl(e.urlAfterRedirects) || this.isLoginUrl(e.urlAfterRedirects)) {
          this.visible.set(false);
          return;
        }
        if (this.auth.isAuthenticated()) {
          this.checkDueToday();
        }
      });

    if (this.isOnReviewPage() || this.isOnLoginPage() || !this.auth.isAuthenticated()) {
      return;
    }
    this.checkDueToday();
  }

  remindLater(): void {
    this.visible.set(false);
    this.startLoop();
  }

  goToReview(): void {
    this.visible.set(false);
    this.router.navigateByUrl('/review');
  }

  private checkDueToday(): void {
    if (this.isOnReviewPage() || this.isOnLoginPage() || !this.auth.isAuthenticated()) {
      this.visible.set(false);
      return;
    }

    const date = this.localIsoDate();
    this.api.dueToday(date).subscribe({
      next: (due) => {
        this.due.set(due);
        if (!due.hasPending) {
          this.stopLoop();
          this.visible.set(false);
          return;
        }
        if (this.isOnReviewPage()) {
          this.visible.set(false);
          return;
        }
        if (typeof document !== 'undefined' && document.hidden) {
          return;
        }
        this.visible.set(true);
      },
      error: () => {
        // Backend down / no table yet: fail silently, don't nag.
      },
    });
  }

  private isOnReviewPage(): boolean {
    return this.isReviewUrl(this.router.url);
  }

  private isOnLoginPage(): boolean {
    return this.isLoginUrl(this.router.url);
  }

  private isReviewUrl(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/review' || path.startsWith('/review/');
  }

  private isLoginUrl(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/login' || path.startsWith('/login/');
  }

  private startLoop(): void {
    if (this.reminderTimer) {
      return;
    }
    this.reminderTimer = setInterval(() => this.checkDueToday(), REMIND_EVERY_MS);
  }

  private stopLoop(): void {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
  }

  private localIsoDate(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

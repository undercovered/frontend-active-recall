import { Component, OnInit, inject, signal } from '@angular/core';
import { ReviewsApi } from '../data/reviews.api';
import { ReviewSession } from '../data/review.model';
import { ReviewCard } from '../ui/review-card/review-card';

@Component({
  selector: 'app-review-page',
  imports: [ReviewCard],
  templateUrl: './review-page.html',
  styleUrl: './review-page.scss',
})
export class ReviewPage implements OnInit {
  private readonly api = inject(ReviewsApi);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly session = signal<ReviewSession | null>(null);

  ngOnInit(): void {
    const date = this.localIsoDate();
    this.api.session(date).subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.msg ?? 'No se pudo cargar el repaso de hoy.',
        );
        this.loading.set(false);
      },
    });
  }

  private localIsoDate(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

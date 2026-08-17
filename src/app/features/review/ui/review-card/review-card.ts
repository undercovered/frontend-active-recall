import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { Checkbox } from 'primeng/checkbox';
import { Textarea } from 'primeng/textarea';
import { ReviewsApi } from '../../data/reviews.api';
import { ReviewAnswerResult, ReviewFlashcard } from '../../data/review.model';

@Component({
  selector: 'app-review-card',
  imports: [FormsModule, ButtonModule, RadioButton, Checkbox, Textarea],
  templateUrl: './review-card.html',
  styleUrl: './review-card.scss',
})
export class ReviewCard implements OnInit {
  private readonly api = inject(ReviewsApi);

  readonly recallId = input.required<string>();
  readonly flashcard = input.required<ReviewFlashcard>();

  protected readonly card = signal<ReviewFlashcard | null>(null);
  protected readonly blocking = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected selectedId: string | null = null;
  protected selectedIds: Record<string, boolean> = {};
  protected openText = '';

  ngOnInit(): void {
    const initial = this.flashcard();
    this.card.set({ ...initial });
    this.selectedId = initial.selectedAnswerIds[0] ?? null;
    this.selectedIds = Object.fromEntries(
      initial.options.map((o) => [
        o.id,
        initial.selectedAnswerIds.includes(o.id),
      ]),
    );
    this.openText = initial.openResponse ?? '';
  }

  protected locked(): boolean {
    return this.card()?.state === 'graded';
  }

  protected flipped(): boolean {
    const state = this.card()?.state;
    return state === 'graded' || state === 'awaiting_grade';
  }

  protected submitChoice(): void {
    const current = this.card();
    if (!current || this.locked() || this.submitting()) {
      return;
    }
    const answerIds =
      current.answerTypeCode === 'single_choice'
        ? this.selectedId
          ? [this.selectedId]
          : []
        : current.options.filter((o) => this.selectedIds[o.id]).map((o) => o.id);

    this.sendAnswer({ answerIds });
  }

  protected submitOpen(): void {
    if (this.locked() || this.submitting()) {
      return;
    }
    this.sendAnswer({ openResponse: this.openText });
  }

  protected grade(isCorrect: boolean): void {
    const current = this.card();
    if (!current || current.state !== 'awaiting_grade' || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .grade({
        recallId: this.recallId(),
        flashcardId: current.id,
        isCorrect,
      })
      .subscribe({
        next: (result) => this.applyResult(result),
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.msg ?? 'No se pudo guardar la calificación.');
        },
      });
  }

  private sendAnswer(payload: { answerIds?: string[]; openResponse?: string }): void {
    const current = this.card();
    if (!current) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .answer({
        recallId: this.recallId(),
        flashcardId: current.id,
        ...payload,
      })
      .subscribe({
        next: (result) => this.applyResult(result),
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.msg ?? 'No se pudo enviar la respuesta.');
        },
      });
  }

  private applyResult(result: ReviewAnswerResult): void {
    this.submitting.set(false);
    this.card.update((c) =>
      c
        ? {
            ...c,
            state: result.status,
            isCorrect: result.isCorrect,
            expectedText: result.expectedText ?? c.expectedText,
            openResponse: result.openResponse ?? c.openResponse,
            selectedAnswerIds: result.selectedAnswerIds ?? c.selectedAnswerIds,
          }
        : c,
    );
    if (result.status === 'graded' && result.isCorrect === false) {
      this.blocking.set(true);
      setTimeout(() => this.blocking.set(false), 800);
    }
  }
}

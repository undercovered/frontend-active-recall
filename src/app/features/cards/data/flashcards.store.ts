import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { FlashcardsApi } from './flashcards.api';
import { CreateFlashcard, Flashcard, UpdateFlashcard } from './flashcard.model';

@Injectable({ providedIn: 'root' })
export class FlashcardsStore {
  private readonly api = inject(FlashcardsApi);

  private readonly _cards = signal<Flashcard[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly cards = this._cards.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly count = computed(() => this._cards().length);

  load(
    filters: { search?: string; subjectId?: string; topicId?: string } = {},
  ): void {
    this._loading.set(true);
    this.api
      .getAll(filters)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (list) => this._cards.set(list),
      });
  }

  create(input: CreateFlashcard): Observable<Flashcard> {
    this._saving.set(true);
    return this.api.create(input).pipe(
      tap((created) => this._cards.update((list) => [created, ...list])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, changes: UpdateFlashcard): Observable<Flashcard> {
    this._saving.set(true);
    return this.api.update(id, changes).pipe(
      tap((updated) =>
        this._cards.update((list) =>
          list.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        ),
      ),
      finalize(() => this._saving.set(false)),
    );
  }

  remove(id: string): Observable<void> {
    return this.api.remove(id).pipe(
      tap(() =>
        this._cards.update((list) => list.filter((c) => c.id !== id)),
      ),
    );
  }
}

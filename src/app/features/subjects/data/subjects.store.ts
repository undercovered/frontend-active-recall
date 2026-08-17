import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { SubjectsApi } from './subjects.api';
import { CreateSubject, Subject, UpdateSubject } from './subject.model';

/**
 * Store for subjects (signals-based). All persistence goes through SubjectsApi;
 * the signals hold the current view of the data for the UI.
 */
@Injectable({ providedIn: 'root' })
export class SubjectsStore {
  private readonly api = inject(SubjectsApi);

  private readonly _subjects = signal<Subject[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private loadedOnce = false;

  readonly subjects = this._subjects.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly count = computed(() => this._subjects().length);

  /** Reads a subject from the already-loaded list (no network). */
  getById(id: string): Subject | undefined {
    return this._subjects().find((s) => s.id === id);
  }

  /** Fetches a single subject from the backend (GET /subjects/:id). */
  fetchById(id: string): Observable<Subject> {
    return this.api.getById(id).pipe(
      tap((subject) =>
        this._subjects.update((list) => {
          const exists = list.some((s) => s.id === subject.id);
          return exists
            ? list.map((s) => (s.id === subject.id ? subject : s))
            : [subject, ...list];
        }),
      ),
    );
  }

  /** Loads the list once (used on first view). */
  ensureLoaded(): void {
    if (!this.loadedOnce) {
      this.load();
    }
  }

  /** Fetches subjects from the API, optionally filtered by name. */
  load(search?: string): void {
    this._loading.set(true);
    this.api
      .getAll(search)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (list) => {
          this._subjects.set(list);
          this.loadedOnce = true;
        },
      });
  }

  create(input: CreateSubject): Observable<Subject> {
    this._saving.set(true);
    return this.api.create(input).pipe(
      tap((created) => this._subjects.update((list) => [created, ...list])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, changes: UpdateSubject): Observable<Subject> {
    this._saving.set(true);
    return this.api.update(id, changes).pipe(
      tap((updated) =>
        this._subjects.update((list) =>
          list.map((s) => (s.id === id ? updated : s)),
        ),
      ),
      finalize(() => this._saving.set(false)),
    );
  }

  remove(id: string): Observable<void> {
    return this.api
      .remove(id)
      .pipe(
        tap(() =>
          this._subjects.update((list) => list.filter((s) => s.id !== id)),
        ),
      );
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { SubjectsApi } from './subjects.api';
import { CreateSubject, Subject, UpdateSubject } from './subject.model';

/**
 * Store for subjects (signals-based).
 *
 * Creation now goes through the backend API (SubjectsApi). Update/remove remain
 * in-memory for now and will be wired to the API in later steps.
 */
@Injectable({ providedIn: 'root' })
export class SubjectsStore {
  private readonly api = inject(SubjectsApi);

  private readonly _subjects = signal<Subject[]>([]);
  private readonly _saving = signal(false);

  readonly subjects = this._subjects.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly count = computed(() => this._subjects().length);

  getById(id: string): Subject | undefined {
    return this._subjects().find((s) => s.id === id);
  }

  /**
   * Creates a subject via the API and prepends it to the local list on success.
   */
  create(input: CreateSubject): Observable<Subject> {
    this._saving.set(true);
    return this.api.create(input).pipe(
      tap((created) => this._subjects.update((list) => [created, ...list])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, changes: UpdateSubject): void {
    this._subjects.update((list) =>
      list.map((s) =>
        s.id === id
          ? { ...s, ...changes, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
  }

  remove(id: string): void {
    this._subjects.update((list) => list.filter((s) => s.id !== id));
  }
}

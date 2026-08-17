import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { TopicsApi } from './topics.api';
import { CreateTopic, Topic, UpdateTopic } from './topic.model';

@Injectable({ providedIn: 'root' })
export class TopicsStore {
  private readonly api = inject(TopicsApi);

  private readonly _topics = signal<Topic[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly topics = this._topics.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly count = computed(() => this._topics().length);

  load(filters: { search?: string; subjectId?: string } = {}): void {
    this._loading.set(true);
    this.api
      .getAll(filters)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (list) => this._topics.set(list),
      });
  }

  create(input: CreateTopic): Observable<Topic> {
    this._saving.set(true);
    return this.api.create(input).pipe(
      tap((created) => this._topics.update((list) => [created, ...list])),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, changes: UpdateTopic): Observable<Topic> {
    this._saving.set(true);
    return this.api.update(id, changes).pipe(
      tap((updated) =>
        this._topics.update((list) =>
          list.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        ),
      ),
      finalize(() => this._saving.set(false)),
    );
  }

  remove(id: string): Observable<void> {
    return this.api.remove(id).pipe(
      tap(() =>
        this._topics.update((list) => list.filter((t) => t.id !== id)),
      ),
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { CreateFlashcard, Flashcard, UpdateFlashcard } from './flashcard.model';

@Injectable({ providedIn: 'root' })
export class FlashcardsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/flashcards`;

  getAll(
    filters: { search?: string; subjectId?: string; topicId?: string } = {},
  ): Observable<Flashcard[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.subjectId) {
      params = params.set('subjectId', filters.subjectId);
    }
    if (filters.topicId) {
      params = params.set('topicId', filters.topicId);
    }
    return this.http
      .get<ApiResponse<Flashcard[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Flashcard> {
    return this.http
      .get<ApiResponse<Flashcard>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(input: CreateFlashcard): Observable<Flashcard> {
    return this.http
      .post<ApiResponse<Flashcard>>(this.baseUrl, input)
      .pipe(map((res) => res.data));
  }

  update(id: string, changes: UpdateFlashcard): Observable<Flashcard> {
    return this.http
      .put<ApiResponse<Flashcard>>(`${this.baseUrl}/${id}`, changes)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { CreateTopic, Topic, UpdateTopic } from './topic.model';

@Injectable({ providedIn: 'root' })
export class TopicsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/topics`;

  getAll(filters: { search?: string; subjectId?: string } = {}): Observable<Topic[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.subjectId) {
      params = params.set('subjectId', filters.subjectId);
    }
    return this.http
      .get<ApiResponse<Topic[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Topic> {
    return this.http
      .get<ApiResponse<Topic>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(input: CreateTopic): Observable<Topic> {
    return this.http
      .post<ApiResponse<Topic>>(this.baseUrl, input)
      .pipe(map((res) => res.data));
  }

  update(id: string, changes: UpdateTopic): Observable<Topic> {
    return this.http
      .put<ApiResponse<Topic>>(`${this.baseUrl}/${id}`, changes)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}

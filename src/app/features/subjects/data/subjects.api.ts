import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { CreateSubject, Subject, UpdateSubject } from './subject.model';

/**
 * HTTP client for the Subjects API.
 * Unwraps the standard { data, msg } envelope and exposes plain domain objects.
 */
@Injectable({ providedIn: 'root' })
export class SubjectsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subjects`;

  getAll(search?: string): Observable<Subject[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http
      .get<ApiResponse<Subject[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Subject> {
    return this.http
      .get<ApiResponse<Subject>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(input: CreateSubject): Observable<Subject> {
    return this.http
      .post<ApiResponse<Subject>>(this.baseUrl, input)
      .pipe(map((res) => res.data));
  }

  update(id: string, changes: UpdateSubject): Observable<Subject> {
    return this.http
      .put<ApiResponse<Subject>>(`${this.baseUrl}/${id}`, changes)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}

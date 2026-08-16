import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { CreateSubject, Subject } from './subject.model';

/**
 * HTTP client for the Subjects API.
 * Unwraps the standard { data, msg } envelope and exposes plain domain objects.
 */
@Injectable({ providedIn: 'root' })
export class SubjectsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subjects`;

  create(input: CreateSubject): Observable<Subject> {
    return this.http
      .post<ApiResponse<Subject>>(this.baseUrl, input)
      .pipe(map((res) => res.data));
  }
}

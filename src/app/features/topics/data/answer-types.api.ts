import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { AnswerType } from './topic.model';

@Injectable({ providedIn: 'root' })
export class AnswerTypesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/answer-types`;

  getAll(): Observable<AnswerType[]> {
    return this.http
      .get<ApiResponse<AnswerType[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }
}

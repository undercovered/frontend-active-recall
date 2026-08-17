import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { DueToday, ReviewAnswerResult, ReviewSession } from './review.model';

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reviews`;

  dueToday(date: string): Observable<DueToday> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ApiResponse<DueToday>>(`${this.baseUrl}/due-today`, { params })
      .pipe(map((res) => res.data));
  }

  session(date: string): Observable<ReviewSession> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ApiResponse<ReviewSession>>(`${this.baseUrl}/session`, { params })
      .pipe(map((res) => res.data));
  }

  answer(input: {
    recallId: string;
    flashcardId: string;
    answerIds?: string[];
    openResponse?: string;
  }): Observable<ReviewAnswerResult> {
    return this.http
      .post<ApiResponse<ReviewAnswerResult>>(`${this.baseUrl}/answer`, input)
      .pipe(map((res) => res.data));
  }

  grade(input: {
    recallId: string;
    flashcardId: string;
    isCorrect: boolean;
  }): Observable<ReviewAnswerResult> {
    return this.http
      .post<ApiResponse<ReviewAnswerResult>>(`${this.baseUrl}/grade`, input)
      .pipe(map((res) => res.data));
  }
}

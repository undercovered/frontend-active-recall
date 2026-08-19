import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response';
import { DashboardStats, StudyStreak } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  stats(date?: string): Observable<DashboardStats> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/stats`, { params })
      .pipe(map((res) => res.data));
  }

  streak(date?: string): Observable<StudyStreak> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http
      .get<ApiResponse<StudyStreak>>(`${this.baseUrl}/streak`, { params })
      .pipe(map((res) => res.data));
  }
}

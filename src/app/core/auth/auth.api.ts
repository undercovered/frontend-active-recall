import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../http/api-response';
import { AuthUser, LoginRequest, LoginResult, RegisterRequest } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(input: LoginRequest): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${this.baseUrl}/login`, input)
      .pipe(map((res) => res.data));
  }

  register(input: RegisterRequest): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/register`, input)
      .pipe(map((res) => res.data));
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data));
  }
}

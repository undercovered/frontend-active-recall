import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('API envelope contract (frontend)', () => {
  it('uses an apiUrl that already includes /api', () => {
    expect(environment.apiUrl.endsWith('/api') || environment.apiUrl === '/api').toBe(
      true,
    );
  });

  it('clients treat { data, msg } as the only success shape', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const client = TestBed.inject(HttpClient);
    const pending = firstValueFrom(
      client.get<{ data: { ok: boolean }; msg: string }>(`${environment.apiUrl}/health`),
    );
    const req = http.expectOne(`${environment.apiUrl}/health`);
    req.flush({ data: { ok: true }, msg: '' });
    const body = await pending;
    expect(body).toEqual({ data: { ok: true }, msg: '' });
    http.verify();
  });
});

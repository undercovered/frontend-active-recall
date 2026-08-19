import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardApi } from './dashboard.api';

describe('DashboardApi', () => {
  it('unwraps GET /dashboard/stats', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(DashboardApi);
    const http = TestBed.inject(HttpTestingController);
    const payload = {
      date: '2026-08-17',
      dueToday: 2,
      topicCount: 4,
      retentionRate: 81.2,
      subjects: [{ id: 's1', dueToday: 1, inProgress: 3 }],
    };
    const pending = firstValueFrom(api.stats('2026-08-17'));
    const req = http.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/dashboard/stats` &&
        r.params.get('date') === '2026-08-17',
    );
    req.flush({ data: payload, msg: '' });
    await expect(pending).resolves.toEqual(payload);
    http.verify();
  });

  it('unwraps GET /dashboard/streak', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(DashboardApi);
    const http = TestBed.inject(HttpTestingController);
    const payload = {
      startedAt: '2026-03-01',
      today: '2026-08-18',
      days: { '2026-08-18': 2 },
    };
    const pending = firstValueFrom(api.streak());
    const req = http.expectOne(`${environment.apiUrl}/dashboard/streak`);
    req.flush({ data: payload, msg: '' });
    await expect(pending).resolves.toEqual(payload);
    http.verify();
  });
});

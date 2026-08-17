import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SubjectsApi } from './subjects.api';
import { Subject } from './subject.model';

const sample: Subject = {
  id: 's1',
  title: 'Java',
  description: 'OOP',
};

describe('SubjectsApi', () => {
  let api: SubjectsApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/subjects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SubjectsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET all unwraps data and omits blank search', async () => {
    const pending = firstValueFrom(api.getAll('   '));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [sample], msg: '' });
    await expect(pending).resolves.toEqual([sample]);
  });

  it('GET all trims and sends search', async () => {
    const pending = firstValueFrom(api.getAll('  jav '));
    const req = http.expectOne((r) => r.url === base && r.params.get('search') === 'jav');
    req.flush({ data: [sample], msg: '' });
    await expect(pending).resolves.toEqual([sample]);
  });

  it('GET by id, POST, PUT and DELETE unwrap the envelope', async () => {
    const byId = firstValueFrom(api.getById('s1'));
    http.expectOne(`${base}/s1`).flush({ data: sample, msg: '' });
    await expect(byId).resolves.toEqual(sample);

    const created = firstValueFrom(api.create({ title: 'Java', description: 'OOP' }));
    const post = http.expectOne(base);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ title: 'Java', description: 'OOP' });
    post.flush({ data: sample, msg: 'ok' });
    await expect(created).resolves.toEqual(sample);

    const updated = firstValueFrom(api.update('s1', { title: 'J' }));
    const put = http.expectOne(`${base}/s1`);
    expect(put.request.method).toBe('PUT');
    put.flush({ data: { ...sample, title: 'J' }, msg: '' });
    await expect(updated).resolves.toEqual({ ...sample, title: 'J' });

    const removed = firstValueFrom(api.remove('s1'));
    const del = http.expectOne(`${base}/s1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ data: { id: 's1' }, msg: '' });
    await expect(removed).resolves.toBeUndefined();
  });
});

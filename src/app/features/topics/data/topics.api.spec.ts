import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TopicsApi } from './topics.api';
import { AnswerTypesApi } from './answer-types.api';
import { CreateTopic, Topic } from './topic.model';

const topic: Topic = {
  id: 't1',
  title: 'Loops',
  subjectId: 's1',
};

describe('TopicsApi', () => {
  let api: TopicsApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/topics`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TopicsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET all sends subjectId and trimmed search', async () => {
    const pending = firstValueFrom(api.getAll({ search: '  loop ', subjectId: 's1' }));
    const req = http.expectOne(
      (r) =>
        r.url === base &&
        r.params.get('search') === 'loop' &&
        r.params.get('subjectId') === 's1',
    );
    req.flush({ data: [topic], msg: '' });
    await expect(pending).resolves.toEqual([topic]);
  });

  it('GET all without filters sends no params', async () => {
    const pending = firstValueFrom(api.getAll());
    const req = http.expectOne(base);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [], msg: '' });
    await expect(pending).resolves.toEqual([]);
  });

  it('CRUD unwraps data', async () => {
    const input: CreateTopic = {
      title: 'Loops',
      subjectId: 's1',
      questions: [
        {
          question: 'Q',
          answerTypeCode: 'open_answer',
          answers: [{ answerText: 'A', isCorrect: true }],
        },
      ],
    };

    const byId = firstValueFrom(api.getById('t1'));
    http.expectOne(`${base}/t1`).flush({ data: topic, msg: '' });
    await expect(byId).resolves.toEqual(topic);

    const created = firstValueFrom(api.create(input));
    const post = http.expectOne(base);
    expect(post.request.body).toEqual(input);
    post.flush({ data: topic, msg: 'Tema creado correctamente.' });
    await expect(created).resolves.toEqual(topic);

    const updated = firstValueFrom(api.update('t1', { title: 'For' }));
    http.expectOne(`${base}/t1`).flush({ data: { ...topic, title: 'For' }, msg: '' });
    await expect(updated).resolves.toEqual({ ...topic, title: 'For' });

    const removed = firstValueFrom(api.remove('t1'));
    http.expectOne(`${base}/t1`).flush({ data: { id: 't1' }, msg: '' });
    await expect(removed).resolves.toBeUndefined();
  });
});

describe('AnswerTypesApi', () => {
  it('GET unwraps the catalog', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(AnswerTypesApi);
    const http = TestBed.inject(HttpTestingController);
    const pending = firstValueFrom(api.getAll());
    http.expectOne(`${environment.apiUrl}/answer-types`).flush({
      data: [{ id: '1', code: 'open_answer', name: 'Abierta' }],
      msg: '',
    });
    await expect(pending).resolves.toEqual([
      { id: '1', code: 'open_answer', name: 'Abierta' },
    ]);
    http.verify();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReviewsApi } from './reviews.api';
import { DueToday, ReviewAnswerResult, ReviewSession } from './review.model';

describe('ReviewsApi', () => {
  let api: ReviewsApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/reviews`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ReviewsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('dueToday and session send the date query param', async () => {
    const due: DueToday = {
      date: '2026-08-16',
      hasPending: true,
      count: 2,
      topicCount: 1,
    };
    const session: ReviewSession = {
      date: '2026-08-16',
      hasPending: false,
      subjects: [],
    };

    const dueP = firstValueFrom(api.dueToday('2026-08-16'));
    const dueReq = http.expectOne(
      (r) => r.url === `${base}/due-today` && r.params.get('date') === '2026-08-16',
    );
    dueReq.flush({ data: due, msg: '' });
    await expect(dueP).resolves.toEqual(due);

    const sessionP = firstValueFrom(api.session('2026-08-16'));
    http
      .expectOne((r) => r.url === `${base}/session` && r.params.get('date') === '2026-08-16')
      .flush({ data: session, msg: '' });
    await expect(sessionP).resolves.toEqual(session);
  });

  it('answer and grade POST the payload and unwrap data', async () => {
    const result: ReviewAnswerResult = {
      flashcardId: 'f1',
      status: 'graded',
      isCorrect: true,
    };

    const ans = firstValueFrom(
      api.answer({ recallId: 'r', flashcardId: 'f1', answerIds: ['a'] }),
    );
    const post = http.expectOne(`${base}/answer`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      recallId: 'r',
      flashcardId: 'f1',
      answerIds: ['a'],
    });
    post.flush({ data: result, msg: '¡Correcto!' });
    await expect(ans).resolves.toEqual(result);

    const grade = firstValueFrom(
      api.grade({ recallId: 'r', flashcardId: 'f1', isCorrect: false }),
    );
    const gradeReq = http.expectOne(`${base}/grade`);
    expect(gradeReq.request.body).toEqual({
      recallId: 'r',
      flashcardId: 'f1',
      isCorrect: false,
    });
    gradeReq.flush({ data: { ...result, isCorrect: false }, msg: '' });
    await expect(grade).resolves.toEqual({ ...result, isCorrect: false });
  });
});

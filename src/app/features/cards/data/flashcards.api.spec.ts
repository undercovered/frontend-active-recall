import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FlashcardsApi } from './flashcards.api';
import { CreateFlashcard, Flashcard } from './flashcard.model';

const card: Flashcard = {
  id: 'c1',
  question: '2+2?',
  topicId: 't1',
  subjectId: 's1',
  answerTypeId: 'at-o',
  answers: [{ answerText: '4', isCorrect: true }],
};

describe('FlashcardsApi', () => {
  let api: FlashcardsApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/flashcards`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(FlashcardsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET all sends trimmed search and filters', async () => {
    const pending = firstValueFrom(
      api.getAll({ search: '  loop ', subjectId: 's1', topicId: 't1' }),
    );
    const req = http.expectOne(
      (r) =>
        r.url === base &&
        r.params.get('search') === 'loop' &&
        r.params.get('subjectId') === 's1' &&
        r.params.get('topicId') === 't1',
    );
    req.flush({ data: [card], msg: '' });
    await expect(pending).resolves.toEqual([card]);
  });

  it('CRUD unwraps data', async () => {
    const input: CreateFlashcard = {
      topicId: 't1',
      question: 'Q',
      answerTypeCode: 'open_answer',
      answers: [{ answerText: 'A', isCorrect: true }],
    };

    const created = firstValueFrom(api.create(input));
    const post = http.expectOne(base);
    expect(post.request.body).toEqual(input);
    post.flush({ data: card, msg: 'Pregunta creada correctamente.' });
    await expect(created).resolves.toEqual(card);

    const updated = firstValueFrom(api.update('c1', { question: '3+3?' }));
    http.expectOne(`${base}/c1`).flush({
      data: { ...card, question: '3+3?' },
      msg: '',
    });
    await expect(updated).resolves.toEqual({ ...card, question: '3+3?' });

    const removed = firstValueFrom(api.remove('c1'));
    http.expectOne(`${base}/c1`).flush({ data: { id: 'c1' }, msg: '' });
    await expect(removed).resolves.toBeUndefined();
  });
});

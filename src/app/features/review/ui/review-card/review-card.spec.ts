import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReviewCard } from './review-card';
import { ReviewsApi } from '../../data/reviews.api';
import { ReviewFlashcard } from '../../data/review.model';

function card(overrides: Partial<ReviewFlashcard> = {}): ReviewFlashcard {
  return {
    id: 'f1',
    question: '2+2?',
    answerTypeCode: 'single_choice',
    options: [
      { id: 'ok', answerText: '4' },
      { id: 'bad', answerText: '5' },
    ],
    state: 'pending',
    isCorrect: null,
    selectedAnswerIds: [],
    openResponse: null,
    expectedText: null,
    ...overrides,
  };
}

describe('ReviewCard', () => {
  let api: { answer: ReturnType<typeof vi.fn>; grade: ReturnType<typeof vi.fn> };

  async function create(flashcard: ReviewFlashcard) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReviewCard],
      providers: [{ provide: ReviewsApi, useValue: api }],
    })
      .overrideComponent(ReviewCard, {
        set: {
          imports: [],
          template: `<div class="host">{{ card()?.question }} {{ card()?.state }}</div>`,
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ReviewCard);
    fixture.componentRef.setInput('recallId', 'r1');
    fixture.componentRef.setInput('flashcard', flashcard);
    fixture.detectChanges();
    return { fixture, cmp: fixture.componentInstance as any };
  }

  beforeEach(() => {
    api = {
      answer: vi.fn(),
      grade: vi.fn(),
    };
  });

  it('starts pending and submits a single choice', async () => {
    api.answer.mockReturnValue(
      of({ flashcardId: 'f1', status: 'graded', isCorrect: true, selectedAnswerIds: ['ok'] }),
    );
    const { fixture, cmp } = await create(card());
    expect(cmp.locked()).toBe(false);
    expect(cmp.flipped()).toBe(false);
    cmp.selectedId = 'ok';
    cmp.submitChoice();
    fixture.detectChanges();
    expect(api.answer).toHaveBeenCalledWith({
      recallId: 'r1',
      flashcardId: 'f1',
      answerIds: ['ok'],
    });
    expect(cmp.locked()).toBe(true);
    expect(cmp.flipped()).toBe(true);
  });

  it('does not submit twice once graded', async () => {
    const { cmp } = await create(card({ state: 'graded', isCorrect: false, selectedAnswerIds: ['bad'] }));
    expect(cmp.locked()).toBe(true);
    cmp.submitChoice();
    expect(api.answer).not.toHaveBeenCalled();
  });

  it('open answers wait for a self-grade', async () => {
    api.answer.mockReturnValue(
      of({
        flashcardId: 'f1',
        status: 'awaiting_grade',
        isCorrect: null,
        expectedText: '4',
        openResponse: 'four',
      }),
    );
    api.grade.mockReturnValue(
      of({ flashcardId: 'f1', status: 'graded', isCorrect: true }),
    );
    const { fixture, cmp } = await create(
      card({ answerTypeCode: 'open_answer', options: [{ id: 'a', answerText: '4' }] }),
    );
    cmp.openText = 'four';
    cmp.submitOpen();
    fixture.detectChanges();
    expect(cmp.flipped()).toBe(true);
    expect(cmp.locked()).toBe(false);
    cmp.grade(true);
    fixture.detectChanges();
    expect(api.grade).toHaveBeenCalledWith({
      recallId: 'r1',
      flashcardId: 'f1',
      isCorrect: true,
    });
    expect(cmp.locked()).toBe(true);
  });

  it('surfaces the API error message', async () => {
    api.answer.mockReturnValue(
      throwError(() => ({ error: { msg: 'Ya respondiste esta pregunta.' } })),
    );
    const { fixture, cmp } = await create(card());
    cmp.selectedId = 'ok';
    cmp.submitChoice();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2+2?');
  });

  it('shakes then unlocks the block flag on a wrong graded answer', async () => {
    vi.useFakeTimers();
    api.answer.mockReturnValue(
      of({ flashcardId: 'f1', status: 'graded', isCorrect: false }),
    );
    const { cmp } = await create(card());
    cmp.selectedId = 'bad';
    cmp.submitChoice();
    expect(cmp.blocking()).toBe(true);
    vi.advanceTimersByTime(800);
    expect(cmp.blocking()).toBe(false);
    vi.useRealTimers();
  });
});

import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReviewPage } from './review-page';
import { ReviewsApi } from '../data/reviews.api';
import { ReviewFlashcard, ReviewSession } from '../data/review.model';
import { ReviewCard } from '../ui/review-card/review-card';

@Component({
  selector: 'app-review-card',
  template: `<p>{{ flashcard().question }}</p>`,
})
class StubReviewCard {
  readonly recallId = input.required<string>();
  readonly flashcard = input.required<ReviewFlashcard>();
}

describe('ReviewPage', () => {
  let api: { session: ReturnType<typeof vi.fn> };

  async function setup() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [provideRouter([]), { provide: ReviewsApi, useValue: api }],
    })
      .overrideComponent(ReviewPage, {
        remove: { imports: [ReviewCard] },
        add: { imports: [StubReviewCard] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ReviewPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    api = { session: vi.fn() };
  });

  it('shows the empty state when there is nothing due', async () => {
    const empty: ReviewSession = {
      date: '2026-08-16',
      hasPending: false,
      subjects: [],
    };
    api.session.mockReturnValue(of(empty));
    const fixture = await setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tienes repasos para hoy.');
  });

  it('groups due flashcards by subject and topic', async () => {
    const session: ReviewSession = {
      date: '2026-08-16',
      hasPending: true,
      subjects: [
        {
          id: 's1',
          title: 'Java',
          topics: [
            {
              id: 't1',
              title: 'Loops',
              recallId: 'r1',
              dateRecall: '2026-08-16',
              flashcards: [
                {
                  id: 'f1',
                  question: '2+2?',
                  answerTypeCode: 'open_answer',
                  options: [{ id: 'a1', answerText: '4' }],
                  state: 'pending',
                  isCorrect: null,
                  selectedAnswerIds: [],
                  openResponse: null,
                  expectedText: null,
                },
              ],
            },
          ],
        },
      ],
    };
    api.session.mockReturnValue(of(session));
    const fixture = await setup();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Java');
    expect(text).toContain('Loops');
    expect(text).toContain('2+2?');
  });

  it('renders the backend error message', async () => {
    api.session.mockReturnValue({
      subscribe: ({ error }: { error: (e: unknown) => void }) =>
        error({ error: { msg: 'Tabla ausente.' } }),
    });
    const fixture = await setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tabla ausente.');
  });
});

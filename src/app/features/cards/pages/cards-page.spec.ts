import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { CardsPage } from './cards-page';
import { FlashcardsStore } from '../data/flashcards.store';
import { TopicsStore } from '../../topics/data/topics.store';
import { SubjectsStore } from '../../subjects/data/subjects.store';
import { AnswerTypesApi } from '../../topics/data/answer-types.api';
import { ReviewsApi } from '../../review/data/reviews.api';
import { TOPIC_REVIEW_LOCK_MSG } from '../../review/data/review-lock';
import { Flashcard } from '../data/flashcard.model';
import { Topic } from '../../topics/data/topic.model';
import { Subject } from '../../subjects/data/subject.model';

const java: Subject = { id: 's1', title: 'Java' };
const loops: Topic = { id: 't1', title: 'Loops', subjectId: 's1' };
const card: Flashcard = {
  id: 'c1',
  question: '2+2?',
  topicId: 't1',
  subjectId: 's1',
  topicTitle: 'Loops',
  subjectTitle: 'Java',
  answerTypeId: 'at-o',
  answerType: { id: 'at-o', code: 'open_answer', name: 'Abierta' },
  answers: [{ answerText: '4', isCorrect: true }],
};

describe('CardsPage', () => {
  let cardsStore: {
    cards: ReturnType<typeof signal<Flashcard[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    saving: ReturnType<typeof signal<boolean>>;
    load: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  async function createPage(
    due: { topicIds?: string[] } = { topicIds: [] },
  ) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CardsPage],
      providers: [
        { provide: FlashcardsStore, useValue: cardsStore },
        {
          provide: TopicsStore,
          useValue: { topics: signal([loops]), load: vi.fn() },
        },
        {
          provide: SubjectsStore,
          useValue: { subjects: signal([java]), load: vi.fn() },
        },
        { provide: AnswerTypesApi, useValue: { getAll: () => of([]) } },
        {
          provide: ReviewsApi,
          useValue: {
            dueToday: () =>
              of({
                date: '2026-08-17',
                hasPending: (due.topicIds?.length ?? 0) > 0,
                count: due.topicIds?.length ?? 0,
                topicCount: due.topicIds?.length ?? 0,
                topicIds: due.topicIds ?? [],
              }),
          },
        },
      ],
    })
      .overrideComponent(CardsPage, {
        set: { imports: [FormsModule], template: `<h1>Preguntas</h1>` },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(CardsPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    cardsStore = {
      cards: signal([card]),
      loading: signal(false),
      saving: signal(false),
      load: vi.fn(),
      create: vi.fn(() => of(card)),
      update: vi.fn(() => of(card)),
      remove: vi.fn(() => of(undefined)),
    };
  });

  it('loads catalogs and questions on init', async () => {
    await createPage();
    expect(cardsStore.load).toHaveBeenCalled();
  });

  it('openCreate resets; openEdit copies the card', async () => {
    const { page } = await createPage();
    page.openCreate();
    expect(page['dialogVisible']()).toBe(true);
    expect(page['editingId']()).toBeNull();
    expect(page.questionModel).toBe('');

    page.openEdit(card);
    expect(page['editingId']()).toBe('c1');
    expect(page.questionModel).toBe('2+2?');
    expect(page['subjectId']()).toBe('s1');
    expect(page['topicId']()).toBe('t1');
  });

  it('save requires subject and topic when creating', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.questionModel = 'Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = 'A';
    page.save();
    expect(cardsStore.create).not.toHaveBeenCalled();

    page.onSubjectChange('s1');
    page.topicId.set('t1');
    page.save();
    expect(cardsStore.create).toHaveBeenCalled();
  });

  it('save updates when editing and surfaces API errors', async () => {
    const { page } = await createPage();
    page.openEdit(card);
    page.save();
    expect(cardsStore.update).toHaveBeenCalled();

    cardsStore.update.mockReturnValue(
      throwError(() => ({ error: { msg: 'No se pudo.' } })),
    );
    page.openEdit(card);
    page.save();
    expect(page['saveError']()).toBe('No se pudo.');
  });

  it('remove asks for confirmation', async () => {
    const { page } = await createPage();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.remove(card);
    expect(cardsStore.remove).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true);
    page.remove(card);
    expect(cardsStore.remove).toHaveBeenCalledWith('c1');
    vi.restoreAllMocks();
  });

  it('blocks edit, delete and create while the topic has a due review', async () => {
    const { page } = await createPage({ topicIds: ['t1'] });
    expect(page.isLocked('t1')).toBe(true);

    page.openEdit(card);
    expect(page['dialogVisible']()).toBe(false);
    expect(cardsStore.update).not.toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    page.remove(card);
    expect(cardsStore.remove).not.toHaveBeenCalled();
    vi.restoreAllMocks();

    page.openCreate();
    page.questionModel = 'Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = 'A';
    page.onSubjectChange('s1');
    page.topicId.set('t1');
    page.save();
    expect(cardsStore.create).not.toHaveBeenCalled();
    expect(page['saveError']()).toBe(TOPIC_REVIEW_LOCK_MSG);
  });
});

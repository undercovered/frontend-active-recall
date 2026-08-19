import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TopicDetailPage } from './topic-detail-page';
import { TopicsStore } from '../data/topics.store';
import { FlashcardsStore } from '../../cards/data/flashcards.store';
import { AnswerTypesApi } from '../data/answer-types.api';
import { ReviewsApi } from '../../review/data/reviews.api';
import { TOPIC_REVIEW_LOCK_MSG } from '../../review/data/review-lock';
import { Topic, TopicFlashcard } from '../data/topic.model';
import { Flashcard } from '../../cards/data/flashcard.model';

const card: TopicFlashcard = {
  id: 'c1',
  question: 'What is a loop?',
  topicId: 't1',
  subjectId: 's1',
  answerTypeId: 'at-o',
  answerType: { id: 'at-o', code: 'open_answer', name: 'Abierta' },
  answers: [{ id: 'a1', answerText: 'A repeating block', isCorrect: true }],
};

const topic: Topic = {
  id: 't1',
  title: 'Loops',
  description: '<p>Iteration</p>',
  subjectId: 's1',
  subjectTitle: 'Java',
  flashcards: [card],
};

const created: Flashcard = {
  id: 'c2',
  question: 'Q',
  topicId: 't1',
  subjectId: 's1',
  answerTypeId: 'at-o',
  answers: [{ answerText: 'A', isCorrect: true }],
};

describe('TopicDetailPage', () => {
  let topicsStore: { fetchById: ReturnType<typeof vi.fn> };
  let cardsStore: {
    saving: ReturnType<typeof signal<boolean>>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let answerTypesApi: { getAll: ReturnType<typeof vi.fn> };

  async function createPage(dueTopicIds: string[] = []) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TopicDetailPage],
      providers: [
        { provide: TopicsStore, useValue: topicsStore },
        { provide: FlashcardsStore, useValue: cardsStore },
        { provide: AnswerTypesApi, useValue: answerTypesApi },
        {
          provide: ReviewsApi,
          useValue: {
            dueToday: () =>
              of({
                date: '2026-08-17',
                hasPending: dueTopicIds.length > 0,
                count: dueTopicIds.length,
                topicCount: dueTopicIds.length,
                topicIds: dueTopicIds,
              }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 't1' })) },
        },
      ],
    })
      .overrideComponent(TopicDetailPage, {
        set: { imports: [FormsModule], template: `<h1>Tema</h1>` },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(TopicDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    topicsStore = { fetchById: vi.fn(() => of(topic)) };
    cardsStore = {
      saving: signal(false),
      create: vi.fn(() => of(created)),
      update: vi.fn(() => of(created)),
      remove: vi.fn(() => of(undefined)),
    };
    answerTypesApi = {
      getAll: vi.fn(() =>
        of([{ id: 'at-o', code: 'open_answer' as const, name: 'Abierta' }]),
      ),
    };
  });

  it('loads the topic with its questions', async () => {
    const { page } = await createPage();
    expect(topicsStore.fetchById).toHaveBeenCalledWith('t1');
    expect(page.topic()?.title).toBe('Loops');
    expect(page.questions()[0].question).toBe('What is a loop?');
    expect(page.typeLabel(card)).toBe('Abierta');
  });

  it('shows a 404 message when the topic is missing', async () => {
    topicsStore.fetchById.mockReturnValue(throwError(() => ({ status: 404 })));
    const { page } = await createPage();
    expect(page.error()).toContain('no existe');
  });

  it('creates a question for the loaded topic without dropdowns', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.questionModel = 'New Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = 'A';
    page.save();
    expect(cardsStore.create).toHaveBeenCalledWith({
      topicId: 't1',
      question: 'New Q',
      answerTypeCode: 'open_answer',
      answers: [{ answerText: 'A', isCorrect: true }],
    });
    expect(topicsStore.fetchById).toHaveBeenCalledTimes(2);
  });

  it('updates and removes a question', async () => {
    const { page } = await createPage();
    page.openEdit(card);
    page.save();
    expect(cardsStore.update).toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    page.remove(card);
    expect(cardsStore.remove).toHaveBeenCalledWith('c1');
    vi.restoreAllMocks();
  });

  it('blocks new, edit and delete while this topic has a due review', async () => {
    const { page } = await createPage(['t1']);
    expect(page.reviewLocked()).toBe(true);

    page.openCreate();
    expect(page['dialogVisible']()).toBe(false);

    page.openEdit(card);
    expect(page['dialogVisible']()).toBe(false);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    page.remove(card);
    expect(cardsStore.remove).not.toHaveBeenCalled();
    vi.restoreAllMocks();

    page.questionModel = 'Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = 'A';
    page.save();
    expect(cardsStore.create).not.toHaveBeenCalled();
    expect(page['saveError']()).toBe(TOPIC_REVIEW_LOCK_MSG);
  });
});

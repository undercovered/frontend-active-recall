import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TopicsStore } from './topics.store';
import { TopicsApi } from './topics.api';
import { Topic } from './topic.model';

const loops: Topic = { id: '1', title: 'Loops', subjectId: 's1' };
const classes: Topic = { id: '2', title: 'Classes', subjectId: 's1' };

describe('TopicsStore', () => {
  let store: TopicsStore;
  let api: {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([loops, classes])),
      create: vi.fn(() => of(loops)),
      update: vi.fn(() => of({ ...loops, title: 'For' })),
      remove: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [TopicsStore, { provide: TopicsApi, useValue: api }],
    });
    store = TestBed.inject(TopicsStore);
  });

  it('load replaces the list', () => {
    store.load({ subjectId: 's1', search: 'loop' });
    expect(api.getAll).toHaveBeenCalledWith({ subjectId: 's1', search: 'loop' });
    expect(store.topics()).toEqual([loops, classes]);
    expect(store.count()).toBe(2);
    expect(store.loading()).toBe(false);
  });

  it('create, update and remove mutate the list', () => {
    store.load();
    api.create.mockReturnValue(of({ id: '0', title: 'New', subjectId: 's1' }));
    store.create({
      title: 'New',
      subjectId: 's1',
      questions: [
        {
          question: 'Q',
          answerTypeCode: 'open_answer',
          answers: [{ answerText: 'A', isCorrect: true }],
        },
      ],
    }).subscribe();
    expect(store.topics()[0].title).toBe('New');

    store.update('1', { title: 'For' }).subscribe();
    expect(store.topics().find((t) => t.id === '1')?.title).toBe('For');

    store.remove('2').subscribe();
    expect(store.topics().some((t) => t.id === '2')).toBe(false);
  });
});

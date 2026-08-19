import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TopicsPage } from './topics-page';
import { TopicsStore } from '../data/topics.store';
import { SubjectsStore } from '../../subjects/data/subjects.store';
import { AnswerTypesApi } from '../data/answer-types.api';
import { Topic } from '../data/topic.model';
import { Subject } from '../../subjects/data/subject.model';

const java: Subject = { id: 's1', title: 'Java' };
const loops: Topic = { id: 't1', title: 'Loops', subjectId: 's1' };

describe('TopicsPage', () => {
  let topicsStore: {
    topics: ReturnType<typeof signal<Topic[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    saving: ReturnType<typeof signal<boolean>>;
    load: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let subjectsStore: {
    subjects: ReturnType<typeof signal<Subject[]>>;
    load: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };

  async function createPage() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TopicsPage],
      providers: [
        { provide: TopicsStore, useValue: topicsStore },
        { provide: SubjectsStore, useValue: subjectsStore },
        { provide: AnswerTypesApi, useValue: { getAll: () => of([]) } },
      ],
    })
      .overrideComponent(TopicsPage, {
        set: { imports: [FormsModule], template: `<h1>Temas</h1>` },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(TopicsPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    topicsStore = {
      topics: signal([loops]),
      loading: signal(false),
      saving: signal(false),
      load: vi.fn(),
      create: vi.fn(() => of(loops)),
      update: vi.fn(() => of(loops)),
      remove: vi.fn(() => of(undefined)),
    };
    subjectsStore = {
      subjects: signal([java]),
      load: vi.fn(),
      getById: vi.fn((id: string) => (id === 's1' ? java : undefined)),
    };
  });

  it('loads subjects and topics on init', async () => {
    await createPage();
    expect(subjectsStore.load).toHaveBeenCalled();
    expect(topicsStore.load).toHaveBeenCalled();
  });

  it('openCreate resets the form; openEdit copies the topic', async () => {
    const { page } = await createPage();
    page.openCreate();
    expect(page['dialogVisible']()).toBe(true);
    expect(page['editingId']()).toBeNull();
    expect(page.titleModel).toBe('');

    page.openEdit(loops);
    expect(page['editingId']()).toBe('t1');
    expect(page.titleModel).toBe('Loops');
    expect(page.subjectIdModel).toBe('s1');
  });

  it('save requires a subject and a question when creating', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.titleModel = 'For';
    page.save();
    expect(topicsStore.create).not.toHaveBeenCalled();

    page.subjectIdModel = 's1';
    page.save();
    expect(topicsStore.create).not.toHaveBeenCalled();
  });

  it('save updates when editing and surfaces API errors', async () => {
    const { page } = await createPage();
    page.openEdit(loops);
    page.save();
    expect(topicsStore.update).toHaveBeenCalledWith('t1', {
      title: 'Loops',
      description: '',
    });

    topicsStore.update.mockReturnValue(
      throwError(() => ({ error: { msg: 'Duplicado.' } })),
    );
    page.openEdit(loops);
    page.save();
    expect(page['saveError']()).toBe('Duplicado.');
  });

  it('remove asks for confirmation', async () => {
    const { page } = await createPage();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.remove(loops);
    expect(topicsStore.remove).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true);
    page.remove(loops);
    expect(topicsStore.remove).toHaveBeenCalledWith('t1');
    vi.restoreAllMocks();
  });
});

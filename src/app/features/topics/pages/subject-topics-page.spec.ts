import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { SubjectTopicsPage } from './subject-topics-page';
import { SubjectsStore } from '../../subjects/data/subjects.store';
import { TopicsStore } from '../data/topics.store';
import { AnswerTypesApi } from '../data/answer-types.api';
import { Subject } from '../../subjects/data/subject.model';
import { Topic } from '../data/topic.model';

const subject: Subject = { id: 's1', title: 'Java' };
const topic: Topic = { id: 't1', title: 'Loops', subjectId: 's1', description: 'd' };

describe('SubjectTopicsPage', () => {
  let subjects: { fetchById: ReturnType<typeof vi.fn> };
  let topicsStore: {
    topics: ReturnType<typeof signal<Topic[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    saving: ReturnType<typeof signal<boolean>>;
    load: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let answerTypesApi: { getAll: ReturnType<typeof vi.fn> };

  async function createPage() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SubjectTopicsPage],
      providers: [
        { provide: SubjectsStore, useValue: subjects },
        { provide: TopicsStore, useValue: topicsStore },
        { provide: AnswerTypesApi, useValue: answerTypesApi },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 's1' })) },
        },
      ],
    })
      .overrideComponent(SubjectTopicsPage, {
        set: { imports: [FormsModule], template: `<h1>Temas</h1>` },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(SubjectTopicsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    subjects = { fetchById: vi.fn(() => of(subject)) };
    topicsStore = {
      topics: signal([topic]),
      loading: signal(false),
      saving: signal(false),
      load: vi.fn(),
      create: vi.fn(() => of(topic)),
      update: vi.fn(() => of(topic)),
      remove: vi.fn(() => of(undefined)),
    };
    answerTypesApi = {
      getAll: vi.fn(() =>
        of([{ id: 'at-o', code: 'open_answer' as const, name: 'Abierta' }]),
      ),
    };
  });

  it('loads the subject, its topics and answer types', async () => {
    const { page } = await createPage();
    expect(topicsStore.load).toHaveBeenCalledWith({ subjectId: 's1' });
    expect(page.subject()?.title).toBe('Java');
    expect(page.answerTypes()[0].code).toBe('open_answer');
  });

  it('falls back to built-in types when the catalog is empty or errors', async () => {
    answerTypesApi.getAll.mockReturnValue(of([]));
    let { page } = await createPage();
    expect(page.answerTypes().length).toBe(3);

    answerTypesApi.getAll.mockReturnValue(throwError(() => new Error('down')));
    ({ page } = await createPage());
    expect(page.typeLabel('single_choice')).toBe('Selección única');
  });

  it('shows a 404 message when the subject is missing', async () => {
    subjects.fetchById.mockReturnValue(throwError(() => ({ status: 404 })));
    const { page } = await createPage();
    expect(page.error()).toContain('no existe');
  });

  it('drafts, reviews and removes questions before saving the topic', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.questionModel = 'What is a for?';
    page.answerTypeCode = 'single_choice';
    page.options = [
      { text: 'loop', isCorrect: true },
      { text: 'class', isCorrect: false },
    ];
    page.singleCorrectIndex = 0;
    page.saveQuestion();
    expect(page['draftQuestions']().length).toBe(1);

    page.reviewQuestion(0);
    expect(page.questionModel).toBe('What is a for?');
    page.questionModel = 'What is for?';
    page.saveQuestion();
    expect(page['draftQuestions']()[0].question).toBe('What is for?');

    page.onRemoveDraft(new Event('click'), 0);
    expect(page['draftQuestions']().length).toBe(0);
  });

  it('validates open, single and multiple drafts', async () => {
    const { page } = await createPage();
    page.openCreate();

    page.saveQuestion();
    expect(page['questionError']()).toContain('obligatoria');

    page.questionModel = 'Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = '';
    page.saveQuestion();
    expect(page['questionError']()).toContain('abierta');

    page.answerTypeCode = 'single_choice';
    page.options = [
      { text: 'a', isCorrect: true },
      { text: '', isCorrect: false },
    ];
    page.saveQuestion();
    expect(page['questionError']()).toContain('dos opciones');

    page.answerTypeCode = 'multiple_choice';
    page.options = [
      { text: 'a', isCorrect: false },
      { text: 'b', isCorrect: false },
    ];
    page.saveQuestion();
    expect(page['questionError']()).toContain('al menos una');
  });

  it('refuses to save a topic without title or questions; then creates', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.save();
    expect(page['saveError']()).toContain('título');

    page.titleModel = 'Loops';
    page.save();
    expect(page['saveError']()).toContain('pregunta');

    page.questionModel = 'Q';
    page.answerTypeCode = 'open_answer';
    page.openAnswer = 'A';
    page.saveQuestion();
    page.save();
    expect(topicsStore.create).toHaveBeenCalledWith({
      title: 'Loops',
      description: '',
      subjectId: 's1',
      questions: [
        {
          question: 'Q',
          answerTypeCode: 'open_answer',
          answers: [{ answerText: 'A', isCorrect: true }],
        },
      ],
    });
  });

  it('updates an existing topic without requiring questions', async () => {
    const { page } = await createPage();
    page.openEdit(topic);
    page.titleModel = 'For loops';
    page.save();
    expect(topicsStore.update).toHaveBeenCalledWith('t1', {
      title: 'For loops',
      description: 'd',
    });
  });

  it('keeps at least two options', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.addOption();
    expect(page.options.length).toBe(3);
    page.removeOption(2);
    expect(page.options.length).toBe(2);
    page.removeOption(0);
    expect(page.options.length).toBe(2);
  });
});

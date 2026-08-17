import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { SubjectsPage } from './subjects-page';
import { SubjectsStore } from '../data/subjects.store';
import { Subject } from '../data/subject.model';

const java: Subject = { id: '1', title: 'Java', description: '<p>OOP</p>' };

describe('SubjectsPage', () => {
  let store: {
    subjects: ReturnType<typeof signal<Subject[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    saving: ReturnType<typeof signal<boolean>>;
    load: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  async function createPage() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SubjectsPage],
      providers: [{ provide: SubjectsStore, useValue: store }],
    })
      .overrideComponent(SubjectsPage, {
        set: { imports: [FormsModule], template: `<h1>Materias</h1>` },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(SubjectsPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    store = {
      subjects: signal([java]),
      loading: signal(false),
      saving: signal(false),
      load: vi.fn(),
      create: vi.fn(() => of(java)),
      update: vi.fn(() => of(java)),
      remove: vi.fn(() => of(undefined)),
    };
  });

  it('loads the list on init', async () => {
    await createPage();
    expect(store.load).toHaveBeenCalled();
  });

  it('openCreate resets the form; openEdit copies the subject', async () => {
    const { page } = await createPage();
    page.openCreate();
    expect(page.dialogVisible()).toBe(true);
    expect(page.editingId()).toBeNull();
    expect(page.form().title).toBe('');

    page.openEdit(java);
    expect(page.editingId()).toBe('1');
    expect(page.form().title).toBe('Java');
    expect(page.descriptionModel).toBe('<p>OOP</p>');
  });

  it('save refuses a blank title and creates otherwise', async () => {
    const { page } = await createPage();
    page.openCreate();
    page.save();
    expect(store.create).not.toHaveBeenCalled();

    page.updateTitle('  Python  ');
    page.descriptionModel = 'data';
    page.save();
    expect(store.create).toHaveBeenCalledWith({
      title: 'Python',
      description: 'data',
    });
    expect(page['dialogVisible']()).toBe(false);
  });

  it('save updates when editing and surfaces API errors', async () => {
    const { page } = await createPage();
    page.openEdit(java);
    page.save();
    expect(store.update).toHaveBeenCalledWith('1', {
      title: 'Java',
      description: '<p>OOP</p>',
    });

    store.update.mockReturnValue(throwError(() => ({ error: { msg: 'Duplicado.' } })));
    page.openEdit(java);
    page.save();
    expect(page['saveError']()).toBe('Duplicado.');
  });

  it('debounces search into store.load', async () => {
    vi.useFakeTimers();
    const { page } = await createPage();
    page.onSearch('jav');
    expect(store.load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(store.load).toHaveBeenCalledWith('jav');
    vi.useRealTimers();
  });

  it('remove asks for confirmation', async () => {
    const { page } = await createPage();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.remove(java);
    expect(store.remove).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true);
    page.remove(java);
    expect(store.remove).toHaveBeenCalledWith('1');
    vi.restoreAllMocks();
  });
});

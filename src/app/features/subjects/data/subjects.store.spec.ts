import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SubjectsStore } from './subjects.store';
import { SubjectsApi } from './subjects.api';
import { Subject } from './subject.model';

const java: Subject = { id: '1', title: 'Java', description: 'OOP' };
const python: Subject = { id: '2', title: 'Python' };

describe('SubjectsStore', () => {
  let store: SubjectsStore;
  let api: {
    getAll: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([java, python])),
      getById: vi.fn(() => of(java)),
      create: vi.fn(() => of(java)),
      update: vi.fn(() => of({ ...java, title: 'Java SE' })),
      remove: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [SubjectsStore, { provide: SubjectsApi, useValue: api }],
    });
    store = TestBed.inject(SubjectsStore);
  });

  it('load populates subjects, count and loading flag', () => {
    expect(store.loading()).toBe(false);
    store.load('jav');
    expect(api.getAll).toHaveBeenCalledWith('jav');
    expect(store.subjects()).toEqual([java, python]);
    expect(store.count()).toBe(2);
    expect(store.loading()).toBe(false);
  });

  it('ensureLoaded fetches only once', () => {
    store.ensureLoaded();
    store.ensureLoaded();
    expect(api.getAll).toHaveBeenCalledTimes(1);
  });

  it('getById reads from the cache; fetchById upserts', () => {
    store.load();
    expect(store.getById('1')).toEqual(java);
    expect(store.getById('missing')).toBeUndefined();

    const extra: Subject = { id: '3', title: 'Go' };
    api.getById.mockReturnValue(of(extra));
    store.fetchById('3').subscribe();
    expect(store.getById('3')?.title).toBe('Go');

    api.getById.mockReturnValue(of({ ...java, description: 'new' }));
    store.fetchById('1').subscribe();
    expect(store.getById('1')?.description).toBe('new');
  });

  it('create prepends, update patches, remove filters', () => {
    store.load();
    api.create.mockReturnValue(of({ id: '0', title: 'New' }));
    store.create({ title: 'New' }).subscribe();
    expect(store.subjects()[0].title).toBe('New');
    expect(store.saving()).toBe(false);

    store.update('1', { title: 'Java SE' }).subscribe();
    expect(store.getById('1')?.title).toBe('Java SE');

    store.remove('2').subscribe();
    expect(store.getById('2')).toBeUndefined();
    expect(store.count()).toBe(2);
  });

  it('create still clears saving when the API errors', () => {
    api.create.mockReturnValue(throwError(() => new Error('fail')));
    store.create({ title: 'X' }).subscribe({ error: () => undefined });
    expect(store.saving()).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HomePage } from './home-page';
import { SubjectsStore } from '../subjects/data/subjects.store';
import { Subject } from '../subjects/data/subject.model';
import { DashboardApi } from './data/dashboard.api';

describe('HomePage', () => {
  it('loads subjects and shows the empty copy when there are none', async () => {
    const store = {
      subjects: signal<Subject[]>([]),
      count: signal(0),
      ensureLoaded: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: SubjectsStore, useValue: store },
        {
          provide: DashboardApi,
          useValue: {
            stats: () =>
              of({
                date: '2026-08-17',
                dueToday: 0,
                topicCount: 0,
                retentionRate: null,
              }),
          },
        },
      ],
    })
      .overrideComponent(HomePage, {
        set: {
          imports: [],
          template: `
            <h1>¡Hola de nuevo!</h1>
            @if (subjectsStore.count() === 0) {
              <p>Aún no tienes materias.</p>
            } @else {
              @for (subject of subjectsStore.subjects(); track subject.id) {
                <a>{{ subject.title }}</a>
              }
            }
          `,
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    expect(store.ensureLoaded).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes materias.');

    store.subjects.set([{ id: '1', title: 'Java' }]);
    store.count.set(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Java');
  });
});

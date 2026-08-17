import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { ReviewReminderService } from './core/services/review-reminder.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: PwaUpdateService, useValue: { init: vi.fn() } },
        {
          provide: ReviewReminderService,
          useValue: {
            init: vi.fn(),
            visible: signal(false),
            due: signal(null),
            remindLater: vi.fn(),
            goToReview: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('creates and boots reminder + PWA services', () => {
    const pwa = TestBed.inject(PwaUpdateService);
    const reminder = TestBed.inject(ReviewReminderService);
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
    expect(pwa.init).toHaveBeenCalled();
    expect(reminder.init).toHaveBeenCalled();
  });

  it('renders a router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});

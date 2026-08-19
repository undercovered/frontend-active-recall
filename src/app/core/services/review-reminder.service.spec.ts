import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { ReviewReminderService } from './review-reminder.service';
import { ReviewsApi } from '../../features/review/data/reviews.api';
import { DueToday } from '../../features/review/data/review.model';
import { AuthService } from '../auth/auth.service';

function due(overrides: Partial<DueToday> = {}): DueToday {
  return {
    date: '2026-08-16',
    hasPending: true,
    count: 3,
    topicCount: 2,
    ...overrides,
  };
}

describe('ReviewReminderService', () => {
  let service: ReviewReminderService;
  let api: { dueToday: ReturnType<typeof vi.fn> };
  let events: Subject<NavigationEnd>;
  let router: {
    url: string;
    events: Subject<NavigationEnd>;
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    events = new Subject<NavigationEnd>();
    api = {
      dueToday: vi.fn(),
    };
    router = {
      url: '/',
      events,
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [
        ReviewReminderService,
        { provide: ReviewsApi, useValue: api },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    });
    service = TestBed.inject(ReviewReminderService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('init is idempotent and shows the dialog when there are pending reviews', () => {
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) => next(due()),
    }));
    service.init();
    service.init();
    expect(api.dueToday).toHaveBeenCalledTimes(1);
    expect(service.visible()).toBe(true);
    expect(service.due()?.count).toBe(3);
  });

  it('does not check or show when the current url is /review', () => {
    router.url = '/review';
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) => next(due()),
    }));
    service.init();
    expect(api.dueToday).not.toHaveBeenCalled();
    expect(service.visible()).toBe(false);
  });

  it('hides the dialog when navigating to /review', () => {
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) => next(due()),
    }));
    service.init();
    expect(service.visible()).toBe(true);
    events.next(new NavigationEnd(1, '/subjects', '/review'));
    expect(service.visible()).toBe(false);
  });

  it('does not show when there is nothing due', () => {
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) =>
        next(due({ hasPending: false, count: 0 })),
    }));
    service.init();
    expect(service.visible()).toBe(false);
  });

  it('fails silently when the backend errors', () => {
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ error }: { error: (e: unknown) => void }) => error(new Error('down')),
    }));
    expect(() => service.init()).not.toThrow();
    expect(service.visible()).toBe(false);
  });

  it('goToReview hides and navigates; remindLater hides', () => {
    vi.useFakeTimers();
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) => next(due()),
    }));
    service.init();
    service.goToReview();
    expect(service.visible()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/review');

    service.visible.set(true);
    service.remindLater();
    expect(service.visible()).toBe(false);
    vi.clearAllTimers();
  });

  it('does not check when the current url is /login', () => {
    router.url = '/login';
    service.init();
    expect(api.dueToday).not.toHaveBeenCalled();
  });

  it('checks due-today after navigating away from /login', () => {
    router.url = '/login';
    api.dueToday.mockImplementation(() => ({
      subscribe: ({ next }: { next: (v: DueToday) => void }) => next(due()),
    }));
    service.init();
    expect(api.dueToday).not.toHaveBeenCalled();

    router.url = '/';
    events.next(new NavigationEnd(2, '/login', '/'));
    expect(api.dueToday).toHaveBeenCalledTimes(1);
    expect(service.visible()).toBe(true);
  });
});

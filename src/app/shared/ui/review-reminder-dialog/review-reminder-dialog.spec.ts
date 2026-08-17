import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReviewReminderDialog } from './review-reminder-dialog';
import { ReviewReminderService } from '../../../core/services/review-reminder.service';
import { DueToday } from '../../../features/review/data/review.model';

describe('ReviewReminderDialog', () => {
  function setup(visible: boolean, due: DueToday | null) {
    const reminder = {
      visible: signal(visible),
      due: signal(due),
      remindLater: vi.fn(),
      goToReview: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReviewReminderDialog],
      providers: [{ provide: ReviewReminderService, useValue: reminder }],
    }).overrideComponent(ReviewReminderDialog, {
      set: {
        imports: [],
        template: `
          @if (reminder.visible()) {
            <div role="alertdialog">
              <h2>Tienes repasos pendientes para hoy</h2>
              @if (reminder.due(); as d) {
                <p>{{ d.count }} tarjetas</p>
              }
              <button type="button" (click)="reminder.remindLater()">Recordarme más tarde</button>
              <button type="button" (click)="reminder.goToReview()">Ir a repasar</button>
            </div>
          }
        `,
      },
    });
    const fixture = TestBed.createComponent(ReviewReminderDialog);
    fixture.detectChanges();
    return { fixture, reminder };
  }

  it('is hidden when there is nothing to remind', () => {
    const { fixture } = setup(false, null);
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('shows the pending copy and wires both actions', () => {
    const { fixture, reminder } = setup(true, {
      date: '2026-08-16',
      hasPending: true,
      count: 4,
      topicCount: 2,
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tienes repasos pendientes para hoy');
    expect(text).toContain('4 tarjetas');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    expect(reminder.remindLater).toHaveBeenCalled();
    buttons[1].click();
    expect(reminder.goToReview).toHaveBeenCalled();
  });
});

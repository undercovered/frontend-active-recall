import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { ReviewReminderService } from './core/services/review-reminder.service';
import { ReviewReminderDialog } from './shared/ui/review-reminder-dialog/review-reminder-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReviewReminderDialog],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('active-recall-front');

  constructor() {
    inject(PwaUpdateService).init();
    inject(ReviewReminderService).init();
  }
}

import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { ReviewReminderService } from '../../../core/services/review-reminder.service';

@Component({
  selector: 'app-review-reminder-dialog',
  imports: [ButtonModule, Tooltip],
  templateUrl: './review-reminder-dialog.html',
  styleUrl: './review-reminder-dialog.scss',
})
export class ReviewReminderDialog {
  protected readonly reminder = inject(ReviewReminderService);
}

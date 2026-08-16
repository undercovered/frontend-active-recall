import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-review-page',
  imports: [CardModule],
  templateUrl: './review-page.html',
  styleUrl: './review-page.scss',
})
export class ReviewPage {}

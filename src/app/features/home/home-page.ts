import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SubjectsStore } from '../subjects/data/subjects.store';
import { StudyHeatmap } from '../../shared/ui/study-heatmap/study-heatmap';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CardModule, ButtonModule, StudyHeatmap],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  protected readonly subjectsStore = inject(SubjectsStore);

  ngOnInit(): void {
    this.subjectsStore.ensureLoaded();
  }
}

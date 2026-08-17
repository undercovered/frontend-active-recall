import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SubjectsStore } from '../subjects/data/subjects.store';
import { StudyHeatmap } from '../../shared/ui/study-heatmap/study-heatmap';
import { DashboardApi } from './data/dashboard.api';
import { DashboardStats } from './data/dashboard.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CardModule, ButtonModule, StudyHeatmap],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private readonly dashboardApi = inject(DashboardApi);
  protected readonly subjectsStore = inject(SubjectsStore);
  protected readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.subjectsStore.ensureLoaded();
    this.dashboardApi.stats().subscribe((data) => this.stats.set(data));
  }

  protected retentionLabel(): string {
    const rate = this.stats()?.retentionRate;
    return rate === null || rate === undefined ? '—' : `${rate}%`;
  }
}

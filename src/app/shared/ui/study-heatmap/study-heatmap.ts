import { Component, computed, input } from '@angular/core';

interface HeatCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * GitHub-style contribution heatmap to visualize study streaks.
 * Pass a map of ISO date (yyyy-mm-dd) → number of reviews.
 * Renders the last `weeks` columns (default 18 ≈ ~4 months).
 */
@Component({
  selector: 'app-study-heatmap',
  templateUrl: './study-heatmap.html',
  styleUrl: './study-heatmap.scss',
})
export class StudyHeatmap {
  readonly data = input<Record<string, number>>({});
  readonly weeks = input<number>(18);

  protected readonly columns = computed<HeatCell[][]>(() => {
    const data = this.data();
    const totalWeeks = this.weeks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start on the Sunday of the earliest visible week.
    const start = new Date(today);
    start.setDate(start.getDate() - (totalWeeks - 1) * 7 - today.getDay());

    const cols: HeatCell[][] = [];
    const cursor = new Date(start);

    for (let w = 0; w < totalWeeks; w++) {
      const week: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.toISOString().slice(0, 10);
        const count = cursor <= today ? (data[iso] ?? 0) : -1;
        week.push({ date: iso, count: Math.max(count, 0), level: this.toLevel(count) });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(week);
    }
    return cols;
  });

  private toLevel(count: number): HeatCell['level'] {
    if (count <= 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    return 4;
  }
}

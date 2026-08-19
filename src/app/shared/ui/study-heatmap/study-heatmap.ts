import {
  Component,
  computed,
  input,
} from '@angular/core';

interface HeatCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  outOfRange: boolean;
  future: boolean;
}

/**
 * GitHub-style heatmap of days the learner reviewed.
 * First year: from account creation through 31 Dec.
 * Later years: 1 Jan through 31 Dec.
 * Columns share the card width: a partial year (e.g. Aug–Dec) stretches;
 * a full year keeps compact cells that still fit 53 weeks.
 */
@Component({
  selector: 'app-study-heatmap',
  templateUrl: './study-heatmap.html',
  styleUrl: './study-heatmap.scss',
})
export class StudyHeatmap {
  readonly data = input<Record<string, number>>({});
  /** Inclusive start (account day, or 1 Jan in later years). */
  readonly startedAt = input<string | null>(null);
  /** Inclusive end (31 Dec of the viewed year). */
  readonly endedAt = input<string | null>(null);
  /** Override "today" in tests (YYYY-MM-DD). */
  readonly today = input<string | null>(null);

  protected readonly weekdayLabels = ['', 'Lun', '', 'Mié', '', 'Vie', ''];

  protected readonly columns = computed<HeatCell[][]>(() => {
    const data = this.data();
    const today = this.parseDay(this.today()) ?? this.startOfLocalDay(new Date());
    const origin =
      this.parseDay(this.startedAt()) ??
      new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last =
      this.parseDay(this.endedAt()) ??
      new Date(today.getFullYear(), 11, 31);

    const start = new Date(origin);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const cols: HeatCell[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const week: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = this.toIso(cursor);
        const outOfRange = cursor < origin || cursor > last;
        const count = outOfRange ? 0 : (data[iso] ?? 0);
        const future = !outOfRange && cursor > today && count === 0;
        week.push({
          date: iso,
          count,
          level: this.toLevel(count),
          outOfRange,
          future,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(week);
    }
    return cols;
  });

  protected readonly weeks = computed(() => this.columns().length);

  protected readonly monthLabels = computed<string[]>(() => {
    const abbr = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    let prev = -1;
    return this.columns().map((week) => {
      const inRange = week.find((cell) => !cell.outOfRange);
      if (!inRange) return '';
      const month = new Date(inRange.date + 'T00:00:00').getMonth();
      if (month !== prev) {
        prev = month;
        return abbr[month];
      }
      return '';
    });
  });

  private parseDay(value: string | null | undefined): Date | null {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    date.setHours(0, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfLocalDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toLevel(count: number): HeatCell['level'] {
    if (count <= 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    return 4;
  }
}

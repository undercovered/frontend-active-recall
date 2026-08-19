import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  input,
  viewChild,
} from '@angular/core';

interface HeatCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

/**
 * GitHub-style heatmap of days the learner actually reviewed.
 * Starts on the month the account was created and scrolls horizontally
 * so the full history stays reachable.
 */
@Component({
  selector: 'app-study-heatmap',
  templateUrl: './study-heatmap.html',
  styleUrl: './study-heatmap.scss',
})
export class StudyHeatmap {
  readonly data = input<Record<string, number>>({});
  /** First day of the account-creation month (YYYY-MM-DD). */
  readonly startedAt = input<string | null>(null);
  /** Override "today" in tests (YYYY-MM-DD). */
  readonly today = input<string | null>(null);

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly weekdayLabels = ['', 'Lun', '', 'Mié', '', 'Vie', ''];

  constructor() {
    afterNextRender(() => this.scrollToEnd());
    effect(() => {
      this.columns();
      this.scrollToEnd();
    });
  }

  protected readonly columns = computed<HeatCell[][]>(() => {
    const data = this.data();
    const today = this.parseDay(this.today()) ?? this.startOfLocalDay(new Date());
    const origin =
      this.parseDay(this.startedAt()) ??
      new Date(today.getFullYear(), today.getMonth(), 1);

    const start = new Date(origin);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const cols: HeatCell[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const week: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = this.toIso(cursor);
        const future = cursor > today;
        const count = future ? 0 : (data[iso] ?? 0);
        week.push({ date: iso, count, level: this.toLevel(count), future });
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
      const month = new Date(week[0].date + 'T00:00:00').getMonth();
      if (month !== prev) {
        prev = month;
        return abbr[month];
      }
      return '';
    });
  });

  private scrollToEnd(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    queueMicrotask(() => {
      el.scrollLeft = el.scrollWidth;
    });
  }

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

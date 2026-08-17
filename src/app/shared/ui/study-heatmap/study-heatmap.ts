import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

interface HeatCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

/**
 * GitHub-style contribution heatmap to visualize study streaks.
 *
 * Fills the host width with square cells. The number of week-columns is
 * derived from a ResizeObserver on the host (which is display:block; 100%),
 * so phones show fewer weeks instead of overflowing the card.
 */
@Component({
  selector: 'app-study-heatmap',
  templateUrl: './study-heatmap.html',
  styleUrl: './study-heatmap.scss',
})
export class StudyHeatmap {
  readonly data = input<Record<string, number>>({});
  readonly maxWeeks = input<number>(30);
  readonly minWeeks = input<number>(8);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly availableWidth = signal(0);

  /** Cell + gap. Larger pitch → fewer, bigger squares on small screens. */
  private readonly columnPitch = 14;
  private readonly yAxisWidth = 28;

  protected readonly weekdayLabels = ['', 'Lun', '', 'Mié', '', 'Vie', ''];
  protected readonly showWeekdays = computed(() => this.availableWidth() >= 260);

  constructor() {
    afterNextRender(() => {
      const el = this.host.nativeElement;
      this.availableWidth.set(el.clientWidth);
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? el.clientWidth;
        this.availableWidth.set(width);
      });
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected readonly weeks = computed(() => {
    const width = this.availableWidth();
    // Until measured, stay conservative so the first paint never overflows.
    if (!width) return this.minWeeks();
    const axis = this.showWeekdays() ? this.yAxisWidth : 0;
    const usable = Math.max(0, width - axis);
    const fit = Math.floor(usable / this.columnPitch);
    return Math.max(this.minWeeks(), Math.min(this.maxWeeks(), fit));
  });

  protected readonly columns = computed<HeatCell[][]>(() => {
    const data = this.data();
    const totalWeeks = this.weeks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (totalWeeks - 1) * 7 - today.getDay());

    const cols: HeatCell[][] = [];
    const cursor = new Date(start);

    for (let w = 0; w < totalWeeks; w++) {
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

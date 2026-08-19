import { TestBed } from '@angular/core/testing';
import { StudyHeatmap } from './study-heatmap';

describe('StudyHeatmap', () => {
  it('builds weeks from the account month through today', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('startedAt', '2026-08-01');
    fixture.componentRef.setInput('today', '2026-08-18');
    fixture.componentRef.setInput('data', { '2026-08-18': 2 });
    fixture.detectChanges();
    const cmp = fixture.componentInstance as any;
    expect(cmp.columns().length).toBeGreaterThan(0);
    const today = cmp
      .columns()
      .flat()
      .find((c: { date: string }) => c.date === '2026-08-18');
    expect(today.count).toBe(2);
    expect(today.level).toBe(1);
  });

  it('maps counts to intensity levels 0–4', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.detectChanges();
    const toLevel = (fixture.componentInstance as any).toLevel.bind(
      fixture.componentInstance,
    );
    expect(toLevel(0)).toBe(0);
    expect(toLevel(1)).toBe(1);
    expect(toLevel(3)).toBe(2);
    expect(toLevel(6)).toBe(3);
    expect(toLevel(10)).toBe(4);
  });

  it('does not count future days even if data exists', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('startedAt', '2026-08-01');
    fixture.componentRef.setInput('today', '2026-08-18');
    fixture.componentRef.setInput('data', { '2026-08-25': 10 });
    fixture.detectChanges();
    const future = (fixture.componentInstance as any)
      .columns()
      .flat()
      .filter((c: { future: boolean }) => c.future);
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((c: { count: number; level: number }) => c.count === 0 && c.level === 0)).toBe(true);
  });
});

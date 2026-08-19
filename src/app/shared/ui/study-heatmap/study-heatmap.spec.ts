import { TestBed } from '@angular/core/testing';
import { StudyHeatmap } from './study-heatmap';

describe('StudyHeatmap', () => {
  it('fills from account day through 31 Dec and paints reviewed days', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('startedAt', '2026-08-18');
    fixture.componentRef.setInput('endedAt', '2026-12-31');
    fixture.componentRef.setInput('today', '2026-08-18');
    fixture.componentRef.setInput('data', { '2026-08-18': 2 });
    fixture.detectChanges();
    const cells = (fixture.componentInstance as any).columns().flat();
    const today = cells.find((c: { date: string }) => c.date === '2026-08-18');
    const yearEnd = cells.find((c: { date: string }) => c.date === '2026-12-31');
    const beforeStart = cells.find((c: { date: string }) => c.date === '2026-08-17');
    expect(today.count).toBe(2);
    expect(today.level).toBe(1);
    expect(today.outOfRange).toBe(false);
    expect(yearEnd.outOfRange).toBe(false);
    expect(yearEnd.future).toBe(true);
    expect(beforeStart.outOfRange).toBe(true);
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

  it('keeps later days of the year visible but without counts', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('startedAt', '2026-08-18');
    fixture.componentRef.setInput('endedAt', '2026-12-31');
    fixture.componentRef.setInput('today', '2026-08-18');
    fixture.componentRef.setInput('data', {});
    fixture.detectChanges();
    const later = (fixture.componentInstance as any)
      .columns()
      .flat()
      .find((c: { date: string }) => c.date === '2026-08-25');
    expect(later.future).toBe(true);
    expect(later.outOfRange).toBe(false);
    expect(later.count).toBe(0);
    expect(later.level).toBe(0);
  });

  it('still paints a day that the API marked after local today', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('startedAt', '2026-08-18');
    fixture.componentRef.setInput('endedAt', '2026-12-31');
    fixture.componentRef.setInput('today', '2026-08-18');
    fixture.componentRef.setInput('data', { '2026-08-19': 1 });
    fixture.detectChanges();
    const nextDay = (fixture.componentInstance as any)
      .columns()
      .flat()
      .find((c: { date: string }) => c.date === '2026-08-19');
    expect(nextDay.count).toBe(1);
    expect(nextDay.level).toBe(1);
    expect(nextDay.future).toBe(false);
  });
});

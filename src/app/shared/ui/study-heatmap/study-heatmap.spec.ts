import { TestBed } from '@angular/core/testing';
import { StudyHeatmap } from './study-heatmap';

describe('StudyHeatmap', () => {
  it('renders minWeeks columns until the host is measured', async () => {
    await TestBed.configureTestingModule({
      imports: [StudyHeatmap],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudyHeatmap);
    fixture.componentRef.setInput('data', { '2099-01-01': 99 });
    fixture.detectChanges();
    const cmp = fixture.componentInstance as any;
    expect(cmp.weeks()).toBe(8);
    expect(cmp.columns().length).toBe(8);
    expect(cmp.columns()[0].length).toBe(7);
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
    fixture.componentRef.setInput('data', { '2999-01-01': 10 });
    fixture.detectChanges();
    const future = (fixture.componentInstance as any)
      .columns()
      .flat()
      .filter((c: { future: boolean }) => c.future);
    expect(future.every((c: { count: number; level: number }) => c.count === 0 && c.level === 0)).toBe(true);
  });
});

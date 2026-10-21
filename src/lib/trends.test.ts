import { describe, expect, it } from 'vitest';
import { buildAllTimeTrend, buildSixMonthTrend, recordedMonthRuns } from './trends';

describe('spend trend gaps', () => {
  it('compares only adjacent recorded months in the six-month view', () => {
    const analysis = buildSixMonthTrend([
      { month: '2026-01', spend: 100 },
      { month: '2026-03', spend: 200 },
      { month: '2026-04', spend: 300 },
    ], '2026-06-15');

    expect(analysis.points.find(point => point.month === '2026-02')?.hasData).toBe(false);
    expect(analysis.points.find(point => point.month === '2026-03')?.changeMoM).toBeNull();
    expect(analysis.points.find(point => point.month === '2026-04')?.changeMoM).toBe(50);
  });

  it('does not label nonconsecutive all-time records as month-over-month', () => {
    const analysis = buildAllTimeTrend([
      { month: '2026-04', spend: 300 },
      { month: '2026-01', spend: 100 },
      { month: '2026-03', spend: 200 },
    ]);

    expect(analysis.points.map(point => point.changeMoM)).toEqual([null, null, 50]);
    expect(buildAllTimeTrend([
      { month: '2025-12', spend: 100 },
      { month: '2026-01', spend: 200 },
    ]).points[1].changeMoM).toBe(100);
  });

  it('splits chart lines at missing or nonconsecutive months', () => {
    const runs = recordedMonthRuns([
      { month: '2026-01', hasData: true },
      { month: '2026-02', hasData: false },
      { month: '2026-03', hasData: true },
      { month: '2026-04', hasData: true },
      { month: '2026-06', hasData: true },
    ]);

    expect(runs.map(run => run.map(point => point.month))).toEqual([
      ['2026-01'],
      ['2026-03', '2026-04'],
      ['2026-06'],
    ]);
  });
});

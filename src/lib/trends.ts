import { localDateISO } from './api';

export type RawTrend = {
  month: string;
  spend: number;
};

export type MonthTrendPoint = {
  month: string;             // "YYYY-MM"
  labelShort: string;        // e.g. "May '26"
  labelFull: string;         // e.g. "May 2026"
  spend: number;             // spend amount or 0
  hasData: boolean;          // true if recorded in ST Finance
  changeMoM: number | null;  // percentage change vs previous month with data
  isPeak: boolean;
  isLowest: boolean;
  isCurrentMonth: boolean;
  percentageOfPeak: number;  // 0 to 100
  percentageOfTotal: number; // 0 to 100
};

export type TrendAnalysis = {
  timeframe: '6m' | 'all';
  points: MonthTrendPoint[];
  totalSpend: number;
  monthlyAverage: number;
  activeMonthsCount: number;
  totalMonthsCount: number;
  peakMonth: MonthTrendPoint | null;
  lowestMonth: MonthTrendPoint | null;
  latestMoMDelta: number | null;
  overallDirection: 'up' | 'down' | 'flat' | 'new';
  dateRangeLabel: string;
};

const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatMonthName(monthStr: string, format: 'short' | 'full' = 'short'): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, mStr] = monthStr.split('-');
  const m = Number(mStr);
  const idx = m - 1;
  if (idx < 0 || idx > 11) return monthStr;
  if (format === 'full') return `${monthNamesFull[idx]} ${yearStr}`;
  return `${monthNamesShort[idx]} '${yearStr.slice(-2)}`;
}

export function buildSixMonthTrend(existingTrends: RawTrend[] = [], referenceDateStr?: string): TrendAnalysis {
  const currentCalendarMonth = (referenceDateStr || localDateISO()).slice(0, 7);
  
  // Find reference month: either current calendar month or latest recorded month
  let endMonthStr = currentCalendarMonth;
  for (const t of existingTrends) {
    if (t?.month && t.month > endMonthStr) {
      endMonthStr = t.month;
    }
  }

  const [refY, refM] = endMonthStr.split('-').map(Number);
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refY, refM - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    monthKeys.push(`${y}-${m}`);
  }

  const spendByMonth = new Map<string, number>();
  existingTrends.forEach(t => {
    if (t?.month) {
      spendByMonth.set(t.month, Number(t.spend) || 0);
    }
  });

  const rawPoints = monthKeys.map(mStr => {
    const hasData = spendByMonth.has(mStr);
    const spend = spendByMonth.get(mStr) ?? 0;
    return {
      month: mStr,
      labelShort: formatMonthName(mStr, 'short'),
      labelFull: formatMonthName(mStr, 'full'),
      spend,
      hasData,
      isCurrentMonth: mStr === currentCalendarMonth,
    };
  });

  const activePoints = rawPoints.filter(p => p.hasData && p.spend > 0);
  const maxSpend = activePoints.length ? Math.max(...activePoints.map(p => p.spend)) : 0;
  const minSpend = activePoints.length ? Math.min(...activePoints.map(p => p.spend)) : 0;
  const totalSpend = activePoints.reduce((acc, p) => acc + p.spend, 0);
  const monthlyAverage = activePoints.length ? totalSpend / activePoints.length : 0;

  let prevSpend: number | null = null;
  let prevHasData = false;

  const points: MonthTrendPoint[] = rawPoints.map(p => {
    let changeMoM: number | null = null;
    if (p.hasData && prevHasData && prevSpend !== null && prevSpend > 0) {
      changeMoM = Number((((p.spend - prevSpend) / prevSpend) * 100).toFixed(1));
    }

    if (p.hasData) {
      prevSpend = p.spend;
      prevHasData = true;
    }

    return {
      ...p,
      changeMoM,
      isPeak: p.hasData && p.spend > 0 && p.spend === maxSpend,
      isLowest: p.hasData && p.spend > 0 && p.spend === minSpend,
      percentageOfPeak: maxSpend > 0 ? Math.round((p.spend / maxSpend) * 100) : 0,
      percentageOfTotal: totalSpend > 0 ? Math.round((p.spend / totalSpend) * 100) : 0,
    };
  });

  const peakMonth = points.find(p => p.isPeak) || null;
  const lowestMonth = points.find(p => p.isLowest) || null;
  
  // Find latest recorded month's MoM delta
  const recordedPoints = points.filter(p => p.hasData);
  const latestRecorded = recordedPoints.at(-1);
  const latestMoMDelta = latestRecorded?.changeMoM ?? null;

  let overallDirection: 'up' | 'down' | 'flat' | 'new' = 'new';
  if (latestMoMDelta !== null) {
    if (latestMoMDelta > 5) overallDirection = 'up';
    else if (latestMoMDelta < -5) overallDirection = 'down';
    else overallDirection = 'flat';
  }

  const firstMonthLabel = formatMonthName(monthKeys[0], 'short');
  const lastMonthLabel = formatMonthName(monthKeys[monthKeys.length - 1], 'short');
  const dateRangeLabel = `${firstMonthLabel} – ${lastMonthLabel}`;

  return {
    timeframe: '6m',
    points,
    totalSpend,
    monthlyAverage,
    activeMonthsCount: activePoints.length,
    totalMonthsCount: 6,
    peakMonth,
    lowestMonth,
    latestMoMDelta,
    overallDirection,
    dateRangeLabel,
  };
}

export function buildAllTimeTrend(existingTrends: RawTrend[] = []): TrendAnalysis {
  const sorted = [...existingTrends].sort((a, b) => a.month.localeCompare(b.month));
  const currentCalendarMonth = localDateISO().slice(0, 7);

  const activePoints = sorted.filter(p => p && p.spend > 0);
  const maxSpend = activePoints.length ? Math.max(...activePoints.map(p => p.spend)) : 0;
  const minSpend = activePoints.length ? Math.min(...activePoints.map(p => p.spend)) : 0;
  const totalSpend = activePoints.reduce((acc, p) => acc + p.spend, 0);
  const monthlyAverage = activePoints.length ? totalSpend / activePoints.length : 0;

  let prevSpend: number | null = null;
  const points: MonthTrendPoint[] = sorted.map(p => {
    let changeMoM: number | null = null;
    if (prevSpend !== null && prevSpend > 0) {
      changeMoM = Number((((p.spend - prevSpend) / prevSpend) * 100).toFixed(1));
    }
    prevSpend = p.spend;

    return {
      month: p.month,
      labelShort: formatMonthName(p.month, 'short'),
      labelFull: formatMonthName(p.month, 'full'),
      spend: p.spend,
      hasData: true,
      changeMoM,
      isPeak: p.spend > 0 && p.spend === maxSpend,
      isLowest: p.spend > 0 && p.spend === minSpend,
      isCurrentMonth: p.month === currentCalendarMonth,
      percentageOfPeak: maxSpend > 0 ? Math.round((p.spend / maxSpend) * 100) : 0,
      percentageOfTotal: totalSpend > 0 ? Math.round((p.spend / totalSpend) * 100) : 0,
    };
  });

  const peakMonth = points.find(p => p.isPeak) || null;
  const lowestMonth = points.find(p => p.isLowest) || null;
  const latestMoMDelta = points.at(-1)?.changeMoM ?? null;

  let overallDirection: 'up' | 'down' | 'flat' | 'new' = 'new';
  if (latestMoMDelta !== null) {
    if (latestMoMDelta > 5) overallDirection = 'up';
    else if (latestMoMDelta < -5) overallDirection = 'down';
    else overallDirection = 'flat';
  }

  const dateRangeLabel = points.length > 0 
    ? `${points[0].labelShort} – ${points.at(-1)?.labelShort}`
    : 'No statements';

  return {
    timeframe: 'all',
    points,
    totalSpend,
    monthlyAverage,
    activeMonthsCount: activePoints.length,
    totalMonthsCount: points.length,
    peakMonth,
    lowestMonth,
    latestMoMDelta,
    overallDirection,
    dateRangeLabel,
  };
}

import { useState, useMemo } from 'react';
import { formatCurrency, formatCompactINR } from '../lib/api';
import { buildSixMonthTrend, buildAllTimeTrend, recordedMonthRuns } from '../lib/trends';
import type { RawTrend } from '../lib/trends';
import { TrendingUp, TrendingDown, Calendar, Flame, Activity, Sparkles } from 'lucide-react';
import '../styles/trend.css';

interface SixMonthTrendProps {
  rawTrends?: RawTrend[];
  currency?: string;
}

export default function SixMonthTrend({ rawTrends = [], currency = 'INR' }: SixMonthTrendProps) {
  const [timeframe, setTimeframe] = useState<'6m' | 'all'>('6m');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const analysis = useMemo(() => {
    return timeframe === '6m'
      ? buildSixMonthTrend(rawTrends)
      : buildAllTimeTrend(rawTrends);
  }, [rawTrends, timeframe]);

  // Default active month for inspection is either the latest recorded month or the last point
  const activeMonthKey = hoveredMonth || selectedMonth || (
    analysis.points.filter(p => p.hasData).at(-1)?.month || analysis.points.at(-1)?.month || ''
  );

  const activePoint = useMemo(() => {
    return analysis.points.find(p => p.month === activeMonthKey) || analysis.points.at(-1) || null;
  }, [analysis.points, activeMonthKey]);

  // SVG dimensions
  const w = 800;
  const h = 240;
  const padX = 50;
  const padY = 32;
  const chartWidth = w - padX * 2;
  const chartHeight = h - padY * 2;

  const pointsCount = analysis.points.length;
  const maxSpend = Math.max(...analysis.points.map(p => p.spend), 1000);

  // Compute SVG coordinates for each point
  const chartPoints = useMemo(() => {
    return analysis.points.map((pt, i) => {
      const x = padX + (i * chartWidth) / Math.max(pointsCount - 1, 1);
      const ratio = pt.hasData ? pt.spend / maxSpend : 0;
      const y = (h - padY) - ratio * chartHeight;
      return { ...pt, x, y };
    });
  }, [analysis.points, chartWidth, chartHeight, maxSpend, padX, padY, pointsCount]);

  // Draw separate runs so missing months never look like recorded spend.
  const recordedRuns = useMemo(() => recordedMonthRuns(chartPoints), [chartPoints]);
  const linePaths = useMemo(() => recordedRuns.map(run =>
    run.map((q, i) => `${i ? 'L' : 'M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
  ), [recordedRuns]);

  const areaPaths = useMemo(() => recordedRuns.map((run, i) => {
    if (run.length < 2) return '';
    const firstX = run[0].x.toFixed(1);
    const lastX = run[run.length - 1].x.toFixed(1);
    const bottomY = (h - padY).toFixed(1);
    return `${linePaths[i]} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }), [linePaths, recordedRuns, h, padY]);

  return (
    <section className="trend-card">
      {/* Header Row */}
      <div className="trend-header-row">
        <div className="trend-title-group">
          <span className="eyebrow">Spending Velocity</span>
          <h2>{timeframe === '6m' ? 'Last 6 Months Trend' : 'All-Time Trend'}</h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
            {analysis.dateRangeLabel} · {analysis.activeMonthsCount} of {analysis.totalMonthsCount} months recorded
          </div>
        </div>

        <div className="trend-pill-group">
          <button
            type="button"
            className={`trend-toggle-btn ${timeframe === '6m' ? 'active' : ''}`}
            onClick={() => setTimeframe('6m')}
          >
            Last 6 Months
          </button>
          <button
            type="button"
            className={`trend-toggle-btn ${timeframe === 'all' ? 'active' : ''}`}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="trend-metrics-grid">
        <div className="trend-metric-box">
          <span className="metric-label">
            <Calendar size={13} /> {timeframe === '6m' ? '6-Month Spend' : 'Total Spend'}
          </span>
          <div className="metric-val">{formatCurrency(analysis.totalSpend, currency)}</div>
          <span className="metric-subtext">
            Across {analysis.activeMonthsCount} active {analysis.activeMonthsCount === 1 ? 'month' : 'months'}
          </span>
        </div>

        <div className="trend-metric-box">
          <span className="metric-label">
            <Activity size={13} /> Monthly Burn Rate
          </span>
          <div className="metric-val">{formatCurrency(analysis.monthlyAverage, currency)}</div>
          <span className="metric-subtext">Average per active month</span>
        </div>

        <div className="trend-metric-box">
          <span className="metric-label">
            <Flame size={13} /> Peak Month
          </span>
          <div className="metric-val">
            {analysis.peakMonth ? analysis.peakMonth.labelShort : '—'}
          </div>
          <span className="metric-subtext">
            {analysis.peakMonth ? formatCurrency(analysis.peakMonth.spend, currency) : 'Awaiting data'}
          </span>
        </div>

        <div className="trend-metric-box">
          <span className="metric-label">
            {analysis.latestMoMDelta != null && analysis.latestMoMDelta < 0 ? (
              <TrendingDown size={13} />
            ) : (
              <TrendingUp size={13} />
            )}{' '}
            Latest MoM Trajectory
          </span>
          <div
            className="metric-val"
            style={{
              color:
                analysis.latestMoMDelta == null
                  ? 'inherit'
                  : analysis.latestMoMDelta > 0
                  ? '#ed848d'
                  : '#72c7a3',
            }}
          >
            {analysis.latestMoMDelta != null
              ? `${analysis.latestMoMDelta > 0 ? '+' : ''}${analysis.latestMoMDelta}%`
              : 'Unavailable'}
          </div>
          <span className="metric-subtext">
            {analysis.overallDirection === 'down'
              ? 'Cooling down vs prior cycle'
              : analysis.overallDirection === 'up'
              ? 'Accelerating vs prior cycle'
              : analysis.overallDirection === 'flat'
              ? 'Stable month-over-month'
              : 'Comparison needs consecutive months'}
          </span>
        </div>
      </div>

      {/* Interactive Detail Inspector for Hovered / Selected Month */}
      {activePoint && (
        <div className="trend-inspector">
          <div className="trend-inspector-left">
            <div>
              <div className="trend-inspector-title">
                <strong>{activePoint.labelFull}</strong>
                {activePoint.isPeak && <span className="pill warning">Peak Month</span>}
                {activePoint.isCurrentMonth && <span className="pill success">Current Cycle</span>}
                {!activePoint.hasData && <span className="pill">Awaiting Data</span>}
              </div>
              <div className="trend-inspector-amount">
                {activePoint.hasData ? formatCurrency(activePoint.spend, currency) : 'No imported data'}
              </div>
            </div>

            {activePoint.hasData && activePoint.changeMoM != null && (
              <span
                className={`pill ${activePoint.changeMoM > 0 ? 'danger' : 'success'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                {activePoint.changeMoM > 0 ? '+' : ''}
                {activePoint.changeMoM}% MoM
              </span>
            )}

            {activePoint.hasData && (
              <span className="pill" style={{ fontSize: 11, padding: '4px 10px' }}>
                {activePoint.percentageOfTotal}% of window spend
              </span>
            )}
          </div>

          <div className="trend-inspector-meta">
            {!activePoint.hasData ? (
              <>No statements imported for {activePoint.labelFull} yet. When uploaded or synced via Gmail, historical velocity updates here automatically.</>
            ) : activePoint.isCurrentMonth ? (
              <>Ongoing billing cycle. Total card spend will update as new statements or transactions settle.</>
            ) : (
              <>Verified card spend aggregated across your imported statements for this billing period.</>
            )}
          </div>
        </div>
      )}

      {/* SVG Sparkline & Chart Area */}
      <div className="trend-chart-container">
        <svg className="trend-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8190ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8190ff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const yLine = (h - padY) - pct * chartHeight;
            const labelValue = maxSpend * pct;
            return (
              <g key={idx}>
                <line
                  className="trend-grid-line"
                  x1={padX}
                  x2={w - padX}
                  y1={yLine}
                  y2={yLine}
                />
                <text
                  x={padX - 8}
                  y={yLine + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {formatCompactINR(labelValue)}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            className="trend-grid-line"
            x1={padX}
            x2={w - padX}
            y1={h - padY}
            y2={h - padY}
          />
          <text
            x={padX - 8}
            y={h - padY + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted)"
          >
            ₹0
          </text>

          {/* Area Fill for Contiguous Recorded Data */}
          {areaPaths.map((path, i) => path && <path key={i} d={path} fill="url(#trendAreaGradient)" />)}

          {/* Trend Lines for Contiguous Recorded Data */}
          {linePaths.map((path, i) => (
            <path
              key={i}
              d={path}
              fill="none"
              stroke="url(#trendLineGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Vertical active indicator guide */}
          {activePoint && (
            (() => {
              const activeChartPoint = chartPoints.find(p => p.month === activePoint.month);
              if (!activeChartPoint) return null;
              return (
                <line
                  x1={activeChartPoint.x}
                  x2={activeChartPoint.x}
                  y1={padY - 10}
                  y2={h - padY}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              );
            })()
          )}

          {/* Data Nodes & Hit Areas */}
          {chartPoints.map((pt) => {
            const isActive = pt.month === activeMonthKey;
            return (
              <g key={pt.month}>
                {/* Invisible hit column for easy hovering */}
                <rect
                  className="trend-hit-area"
                  x={pt.x - chartWidth / (pointsCount * 2)}
                  y={padY - 10}
                  width={chartWidth / Math.max(pointsCount, 1)}
                  height={chartHeight + padY + 10}
                  onMouseEnter={() => setHoveredMonth(pt.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  onClick={() => setSelectedMonth(pt.month)}
                />

                {/* Node circle */}
                {pt.hasData ? (
                  <>
                    <circle
                      className={`trend-node-circle ${isActive ? 'active' : ''}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 7 : 5}
                      fill={pt.isPeak ? '#e6b86a' : '#131720'}
                      stroke={pt.isPeak ? '#e6b86a' : '#8190ff'}
                      strokeWidth={isActive ? 3.5 : 2.5}
                      onMouseEnter={() => setHoveredMonth(pt.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      onClick={() => setSelectedMonth(pt.month)}
                    />
                    {pt.isPeak && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill="none"
                        stroke="#e6b86a"
                        strokeWidth="1.5"
                        opacity="0.4"
                      />
                    )}
                  </>
                ) : (
                  /* Pending Node marker */
                  <circle
                    className={`trend-node-circle ${isActive ? 'active' : ''}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="var(--surface-2)"
                    stroke="var(--muted)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    onMouseEnter={() => setHoveredMonth(pt.month)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => setSelectedMonth(pt.month)}
                  />
                )}

                {/* X-Axis Month Label */}
                <text
                  className={`trend-axis-text ${isActive ? 'active' : ''}`}
                  x={pt.x}
                  y={h - 10}
                  onClick={() => setSelectedMonth(pt.month)}
                >
                  {pt.labelShort}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Month-by-Month Cards Grid */}
      <div className="trend-months-grid">
        {analysis.points.map((pt) => {
          const isActive = pt.month === activeMonthKey;
          return (
            <div
              key={pt.month}
              className={`trend-month-card ${isActive ? 'active' : ''} ${!pt.hasData ? 'no-data' : ''}`}
              onClick={() => setSelectedMonth(pt.month)}
              onMouseEnter={() => setHoveredMonth(pt.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div className="trend-month-card-header">
                <strong>{pt.labelShort}</strong>
                {pt.isPeak && <span className="pill warning" style={{ padding: '2px 6px', fontSize: 9 }}>Peak</span>}
                {pt.isCurrentMonth && <span className="pill success" style={{ padding: '2px 6px', fontSize: 9 }}>Now</span>}
                {!pt.hasData && <span className="pill" style={{ padding: '2px 6px', fontSize: 9 }}>Pending</span>}
              </div>

              <div className={`trend-month-card-spend ${!pt.hasData ? 'pending' : ''}`}>
                {pt.hasData ? formatCurrency(pt.spend, currency) : 'No data yet'}
              </div>

              {/* Progress bar relative to peak month */}
              <div className="trend-month-bar-wrap">
                <div
                  className="trend-month-bar"
                  style={{
                    width: `${pt.hasData ? Math.max(pt.percentageOfPeak, 4) : 0}%`,
                    opacity: pt.hasData ? 1 : 0.2,
                  }}
                />
              </div>

              {/* MoM Delta indicator */}
              <div className="trend-month-delta">
                {pt.hasData ? (
                  pt.changeMoM != null ? (
                    <span className={pt.changeMoM > 0 ? 'trend-delta-up' : 'trend-delta-down'}>
                      {pt.changeMoM > 0 ? '+' : ''}{pt.changeMoM}% MoM
                    </span>
                  ) : (
                    <span className="trend-delta-none">Base month</span>
                  )
                ) : (
                  <span className="trend-delta-none">Awaiting statements</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory callout for data readiness */}
      <div className="trend-callout">
        <Sparkles size={16} />
        <div>
          <strong>{timeframe === '6m' ? 'Rolling six-month view:' : 'All-time view:'}</strong> Spending history updates as new statements are imported. Month-over-month comparisons appear only for consecutive recorded months.
        </div>
      </div>
    </section>
  );
}

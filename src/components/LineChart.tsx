import { useState } from 'react';
import { formatCurrency } from '../lib/api';
import { formatMonthName } from '../lib/trends';

export default function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data.length) return <div className="empty">Import statements to unlock your spending trend.</div>;

  const w = 800;
  const h = 230;
  const pX = 40;
  const pTop = 25;
  const pBottom = 36;
  const chartHeight = h - pTop - pBottom;
  const chartWidth = w - pX * 2;

  const max = Math.max(...data.map(x => x.value), 1);
  const min = Math.min(...data.map(x => x.value), 0);
  const span = Math.max(max - min, 1);

  const pts = data.map((d, i) => ({
    x: pX + (i * chartWidth) / Math.max(data.length - 1, 1),
    y: (h - pBottom) - ((d.value - min) / span) * chartHeight,
    label: d.label,
    formattedLabel: formatMonthName(d.label, 'short'),
    value: d.value,
  }));

  const line = pts.map((q, i) => `${i ? 'L' : 'M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts.at(-1)?.x ?? w - pX} ${h - pBottom} L ${pts[0]?.x ?? pX} ${h - pBottom} Z`;

  const activePoint = hoveredIdx !== null ? pts[hoveredIdx] : null;

  return (
    <div className="chart-box" style={{ position: 'relative' }}>
      {activePoint && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--accent)',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <span className="muted">{activePoint.formattedLabel}:</span>
          <strong>{formatCurrency(activePoint.value)}</strong>
        </div>
      )}
      <svg className="spark-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(v => (
          <line
            key={v}
            className="chart-grid-line"
            x1={pX}
            x2={w - pX}
            y1={pTop + chartHeight * v}
            y2={pTop + chartHeight * v}
          />
        ))}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGradient)" />
        <path
          d={line}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={pTop}
            y2={h - pBottom}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        )}

        {pts.map((q, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g key={i}>
              <rect
                x={q.x - chartWidth / (pts.length * 2)}
                y={pTop}
                width={chartWidth / Math.max(pts.length, 1)}
                height={chartHeight + pBottom}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              <circle
                cx={q.x}
                cy={q.y}
                r={isHovered ? 7 : 5}
                fill="#10131b"
                stroke={isHovered ? '#22d3ee' : '#a78bfa'}
                strokeWidth={isHovered ? 3.5 : 2.5}
                style={{ transition: 'all 0.15s ease', pointerEvents: 'none' }}
              />
              <text
                x={q.x}
                y={h - 12}
                textAnchor="middle"
                fontSize="11"
                fill={isHovered ? 'var(--accent)' : 'var(--muted)'}
                fontWeight={isHovered ? '700' : '500'}
                style={{ pointerEvents: 'none' }}
              >
                {q.formattedLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

import { formatCurrency } from '../lib/api';
import { endpoints, useLiveData } from '../lib/live';
import SixMonthTrend from './SixMonthTrend';

type Summary = {
  totalSpend?: number;
  avgMonthlySpend?: number;
  deltaPercent?: number;
  cardBreakdown?: { bank: string; last4: string; amount: number; currency?: string }[];
};

type Trends = {
  trends?: { month: string; spend: number }[];
  trendsByCurrency?: { trends: { month: string; spend: number }[] }[];
};

type Categories = {
  breakdown?: { category: string; amount: number; percentage: number }[];
  byCurrency?: { breakdown: { category: string; amount: number; percentage: number }[] }[];
};

type Merchants = {
  merchants?: { merchant: string; count: number; amount: number }[];
  merchantsByCurrency?: { merchants: { merchant: string; count: number; amount: number }[] }[];
};

export default function AnalyticsView() {
  const summaryState = useLiveData<Summary>(endpoints.summary);
  const summary = summaryState.data;
  const trends = useLiveData<Trends>(endpoints.trends).data;
  const cats = useLiveData<Categories>(endpoints.categories).data;
  const merchants = useLiveData<Merchants>(endpoints.merchants).data;

  if (!summary) {
    return summaryState.error ? (
      <div className="card">ST Finance temporarily unavailable. Retrying…</div>
    ) : (
      <div className="grid grid-3">
        {[1, 2, 3].map(item => (
          <div className="card" key={item}>
            <div className="loading" />
          </div>
        ))}
      </div>
    );
  }

  const tl = trends?.trends || trends?.trendsByCurrency?.[0]?.trends || [];
  const cl = cats?.breakdown || cats?.byCurrency?.[0]?.breakdown || [];
  const ml = merchants?.merchants || merchants?.merchantsByCurrency?.[0]?.merchants || [];

  return (
    <>
      <div className="grid grid-3">
        <div className="card">
          <div className="metric-label">All-time recorded spend</div>
          <div className="metric-value">{formatCurrency(summary.totalSpend)}</div>
        </div>
        <div className="card">
          <div className="metric-label">Monthly average</div>
          <div className="metric-value">{formatCurrency(summary.avgMonthlySpend)}</div>
        </div>
        <div className="card">
          <div className="metric-label">Month delta</div>
          <div className="metric-value">
            {summary.deltaPercent == null
              ? 'Unknown'
              : `${summary.deltaPercent > 0 ? '+' : ''}${summary.deltaPercent.toFixed(1)}%`}
          </div>
        </div>
      </div>

      <div className="section">
        <SixMonthTrend rawTrends={tl} currency="INR" />
      </div>

      <div className="grid grid-2 section">
        <section className="card">
          <div className="section-title-row">
            <div className="section-title">Category mix</div>
            <span className="pill">Spend breakdown</span>
          </div>
          {cl.length ? (
            cl.slice(0, 8).map(item => (
              <div className="category-row" key={item.category}>
                <div style={{ textTransform: 'capitalize', fontSize: 13 }}>
                  {item.category.replaceAll('_', ' ')}
                </div>
                <div className="category-bar">
                  <span style={{ width: `${Math.min(item.percentage || 0, 100)}%` }} />
                </div>
                <div style={{ textAlign: 'right', fontWeight: 750, fontSize: 12 }}>
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty">Your category breakdown will appear after statements are imported.</div>
          )}
        </section>

        <section className="card">
          <div className="section-title-row">
            <div className="section-title">Spend by card</div>
            <span className="pill">Active portfolio</span>
          </div>
          {summary.cardBreakdown?.length ? (
            summary.cardBreakdown.map(item => (
              <div className="simple-row" key={`${item.bank}:${item.last4}`}>
                <div>
                  <strong>{item.bank.toUpperCase()} ··{item.last4}</strong>
                </div>
                <strong>{formatCurrency(item.amount, item.currency || 'INR')}</strong>
              </div>
            ))
          ) : (
            <div className="empty">Card insights will appear after a statement is imported.</div>
          )}
        </section>
      </div>

      <div className="section">
        <section className="card">
          <div className="section-title-row">
            <div>
              <div className="section-title">Top merchants</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Ranked by cumulative spend across all statements
              </div>
            </div>
          </div>
          {ml.length ? (
            <div className="grid grid-3">
              {ml.slice(0, 12).map(item => (
                <div className="simple-row" key={item.merchant} style={{ padding: '12px 10px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div>
                    <strong>{item.merchant}</strong>
                    <small>{item.count} transactions</small>
                  </div>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Merchant insights will appear here.</div>
          )}
        </section>
      </div>
    </>
  );
}

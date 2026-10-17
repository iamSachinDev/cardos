import { formatCurrency } from '../lib/api';
import { endpoints, useLiveData } from '../lib/live';
import LineChart from './LineChart';
type Summary = { totalSpend?: number; avgMonthlySpend?: number; deltaPercent?: number; cardBreakdown?: { bank:string; last4:string; amount:number; currency?:string }[] };
type Trends = { trends?: { month:string; spend:number }[]; trendsByCurrency?: { trends:{ month:string; spend:number }[] }[] };
type Categories = { breakdown?: { category:string; amount:number; percentage:number }[]; byCurrency?: { breakdown:{ category:string; amount:number; percentage:number }[] }[] };
type Merchants = { merchants?: { merchant:string; count:number; amount:number }[]; merchantsByCurrency?: { merchants:{ merchant:string; count:number; amount:number }[] }[] };
export default function AnalyticsView() {
  const summaryState = useLiveData<Summary>(endpoints.summary);
  const summary = summaryState.data;
  const trends = useLiveData<Trends>(endpoints.trends).data;
  const cats = useLiveData<Categories>(endpoints.categories).data;
  const merchants = useLiveData<Merchants>(endpoints.merchants).data;
  if (!summary) return summaryState.error ? <div className="card">Burnrate temporarily unavailable. Retrying…</div> : <div className="grid grid-3">{[1,2,3].map(item=><div className="card" key={item}><div className="loading"/></div>)}</div>;
  const tl = trends?.trends || trends?.trendsByCurrency?.[0]?.trends || [];
  const cl = cats?.breakdown || cats?.byCurrency?.[0]?.breakdown || [];
  const ml = merchants?.merchants || merchants?.merchantsByCurrency?.[0]?.merchants || [];
  return <><div className="grid grid-3"><div className="card"><div className="metric-label">Total spend</div><div className="metric-value">{formatCurrency(summary.totalSpend)}</div></div><div className="card"><div className="metric-label">Monthly average</div><div className="metric-value">{formatCurrency(summary.avgMonthlySpend)}</div></div><div className="card"><div className="metric-label">Month delta</div><div className="metric-value">{summary.deltaPercent==null?'Unknown':`${summary.deltaPercent>0?'+':''}${summary.deltaPercent.toFixed(1)}%`}</div></div></div>
    <div className="grid grid-2 section"><section className="card"><div className="section-title">Spend trend</div><LineChart data={tl.map(item=>({label:item.month,value:item.spend}))}/></section><section className="card"><div className="section-title">Category mix</div>{cl.length ? cl.slice(0,8).map(item=><div className="category-row" key={item.category}><div style={{textTransform:'capitalize',fontSize:13}}>{item.category.replaceAll('_',' ')}</div><div className="category-bar"><span style={{width:`${Math.min(item.percentage||0,100)}%`}}/></div><div style={{textAlign:'right',fontWeight:750,fontSize:12}}>{formatCurrency(item.amount)}</div></div>) : <div className="empty">Your category breakdown will appear after statements are imported.</div>}</section></div>
    <div className="grid grid-2 section"><section className="card"><div className="section-title">Top merchants</div>{ml.length ? ml.slice(0,12).map(item=><div className="simple-row" key={item.merchant}><div><strong>{item.merchant}</strong><small>{item.count} transactions</small></div><strong>{formatCurrency(item.amount)}</strong></div>) : <div className="empty">Merchant insights will appear here.</div>}</section><section className="card"><div className="section-title">Spend by card</div>{summary.cardBreakdown?.length ? summary.cardBreakdown.map(item=><div className="simple-row" key={`${item.bank}:${item.last4}`}><div><strong>{item.bank.toUpperCase()} ··{item.last4}</strong></div><strong>{formatCurrency(item.amount,item.currency||'INR')}</strong></div>) : <div className="empty">Card insights will appear after a statement is imported.</div>}</section></div>
  </>;
}

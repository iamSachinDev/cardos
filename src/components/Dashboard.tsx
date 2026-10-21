import { useMemo } from 'react';
import { bankClass, bankLabel, formatCurrency, formatDate, upcomingDues } from '../lib/api';
import type { Card, DueItem, Transaction, Statement } from '../lib/api';
import { endpoints, useLiveData, useConnection } from '../lib/live';
import LineChart from './LineChart';

type Summary={ totalSpend:number|null; deltaPercent:number|null; avgMonthlySpend?:number|null; creditLimit?:number|null; cardBreakdown?:{bank:string;last4:string;amount:number;count:number;currency?:string}[] };
type Trends={ trends?:{month:string;spend:number}[]; trendsByCurrency?:{currency:string;trends:{month:string;spend:number}[]}[] };
type Cats={ breakdown?:{category:string;amount:number;percentage:number;count:number}[]; byCurrency?:{currency:string;breakdown:{category:string;amount:number;percentage:number;count:number}[]}[] };

export default function Dashboard(){
  const cardsState=useLiveData<Card[]>(endpoints.cards); const summaryState=useLiveData<Summary>(endpoints.summary);
  const duesState=useLiveData<{items:DueItem[]}>(endpoints.dues); const trendsState=useLiveData<Trends>(endpoints.trends);
  const catsState=useLiveData<Cats>(endpoints.categories); const txState=useLiveData<{transactions:Transaction[]}>(endpoints.transactions);
  const statementsState=useLiveData<{statements:Statement[]}>(endpoints.statements); const connection=useConnection();
  const cards=cardsState.data||[]; const summary=summaryState.data; const dues=upcomingDues(duesState.data?.items,cards);
  const trends=trendsState.data||{}; const cats=catsState.data||{}; const txns=(txState.data?.transactions||[]).slice(0,6);
  const statementCount=statementsState.data?.statements?.length||0;
  const trendData=useMemo(()=>{ const list=trends.trends || trends.trendsByCurrency?.[0]?.trends || []; return list.map(x=>({label:x.month,value:x.spend})); },[trends]);
  const categories=cats.breakdown || cats.byCurrency?.[0]?.breakdown || [];
  const dueTotal=dues.reduce((a,b)=>a+(b.totalAmountDue||0),0);
  const breakdown=new Map((summary?.cardBreakdown||[]).map(x=>[`${x.bank}:${x.last4}`,x]));
  if (!summary && connection.state === 'offline') return <div className="card offline-card"><div className="section-title">ST Finance temporarily unavailable</div><p className="muted">Retrying the local connection automatically…</p></div>;
  if (!summary) return <div className="grid grid-4">{[1,2,3,4].map(x=><div className="card" key={x}><div className="loading"/><div className="loading" style={{marginTop:18,width:'70%'}}/></div>)}</div>;
  const next=dues[0];
  return <>
    <section className="hero card"><div className="hero-copy"><span className="eyebrow">Next 30 days</span><div className="hero-label">Upcoming payments</div><div className="hero-amount">{formatCurrency(dueTotal)}</div><div className="hero-meta">{dues.length} payment{dues.length===1?'':'s'} ahead · From your local data</div></div><div className="hero-next"><div className="metric-label">Next payment</div>{next?<><strong>{bankLabel(next.bank)} ··{next.cardLast4}</strong><div className="hero-next-amount">{formatCurrency(next.totalAmountDue,next.currency||'INR')}</div><div className="muted">Due {formatDate(next.dueDate)}</div></>:<div className="muted">Nothing due is currently recorded.</div>}</div></section>
    <div className="grid grid-4">
      <div className="card"><div className="metric-label">Total spend</div><div className="metric-value">{formatCurrency(summary?.totalSpend)}</div><div className="metric-sub">All imported statements</div></div>
      <div className="card"><div className="metric-label">Transactions</div><div className="metric-value">{(txState.data as any)?.total ?? txState.data?.transactions?.length ?? 0}</div><div className="metric-sub">Imported from statements</div></div>
      <div className="card"><div className="metric-label">Avg monthly spend</div><div className="metric-value">{formatCurrency(summary?.avgMonthlySpend)}</div><div className="metric-sub">Calculated from history</div></div>
      <div className="card"><div className="metric-label">Cards · Statements</div><div className="metric-value">{cards.length} <span className="muted" style={{fontSize:16}}>· {statementCount}</span></div><div className="metric-sub">Private · local-only data</div></div>
    </div>

    <div className="grid grid-2 section">
      <section className="card"><div className="section-title-row"><div><div className="section-title">Spending velocity</div><div className="muted" style={{fontSize:12,marginTop:4}}>Monthly trend across imported statements</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><a href="/analytics" className="muted" style={{fontSize:12}}>6M trend →</a><span className="pill">Live</span></div></div><LineChart data={trendData}/></section>
      <section className="card"><div className="section-title-row"><div className="section-title">Next payments</div><a className="muted" href="/bills" style={{fontSize:12}}>View all →</a></div>
        {dues.length?dues.slice(0,5).map(d=><div className="due-item" key={`${d.cardId}-${d.dueDate}`}><span className="due-dot"/><div><strong>{bankLabel(d.bank)} ····{d.cardLast4}</strong><div className="due-date">Due {formatDate(d.dueDate)}</div></div><div className="due-amount">{formatCurrency(d.totalAmountDue,d.currency||'INR')}</div></div>):<div className="empty">No upcoming dues yet.<br/>Import statements to populate bill reminders.</div>}
      </section>
    </div>

    <section className="section"><div className="section-title-row"><div className="section-title">My cards</div><a className="muted" href="/cards" style={{fontSize:12}}>Manage cards →</a></div>
      <div className="grid grid-3">{cards.slice(0,6).map(c=>{const b=breakdown.get(`${c.bank}:${c.last4}`); return <a href={`/cards/detail?id=${encodeURIComponent(c.id)}`} className={`card bank-card ${bankClass(c.bank)}`} key={c.id}><div><div className="bank-name">{bankLabel(c.bank)}</div><div className="card-name">{c.name||'Credit Card'}</div></div><div><div className="digits">•••• {c.last4}</div><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',marginTop:16}}><div><div style={{fontSize:10,opacity:.7,textTransform:'uppercase',letterSpacing:'.1em'}}>Spend</div><div className="card-spend">{summary ? b ? formatCurrency(b.amount,b.currency||'INR') : 'No imported data' : 'Unknown'}</div></div><div style={{fontSize:12,opacity:.75}}>{b ? `${b.count} txns` : 'No imported data'}</div></div></div></a>})}</div>
    </section>

    <div className="grid grid-2 section">
      <section className="card"><div className="section-title-row"><div className="section-title">Top categories</div><a href="/analytics" className="muted" style={{fontSize:12}}>Explore →</a></div>{categories.length?categories.slice(0,6).map(c=><div className="category-row" key={c.category}><div style={{textTransform:'capitalize',fontSize:13}}>{c.category.replaceAll('_',' ')}</div><div className="category-bar"><span style={{width:`${Math.min(c.percentage||0,100)}%`}}/></div><div style={{textAlign:'right',fontWeight:750,fontSize:12}}>{formatCurrency(c.amount)}</div></div>):<div className="empty">No category data yet.</div>}</section>
      <section className="card"><div className="section-title-row"><div className="section-title">Recent transactions</div><a href="/transactions" className="muted" style={{fontSize:12}}>View all →</a></div>{txns.length?<div className="table-wrap"><table style={{minWidth:0}}><tbody>{txns.map(t=><tr key={t.id}><td><strong>{t.merchant}</strong><div className="muted" style={{fontSize:11,marginTop:3}}>{formatDate(t.date)} · {bankLabel(t.bank)} {t.cardLast4}</div></td><td style={{textAlign:'right',fontWeight:800}}>{formatCurrency(t.amount,t.currency||'INR')}</td></tr>)}</tbody></table></div>:<div className="empty">No transactions yet.</div>}</section>
    </div>
  </>;
}

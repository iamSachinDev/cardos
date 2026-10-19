import { useEffect, useMemo, useRef, useState } from 'react';
import { bankLabel, formatCurrency, formatDate } from '../lib/api';
import type { Card, Transaction } from '../lib/api';
import { endpoints, useLiveData, useLiveQuery } from '../lib/live';

type Response = { transactions: Transaction[]; total: number };
type CategoryResponse = { breakdown?: { category:string }[] };
export default function TransactionsView() {
  const [search,setSearch] = useState(''); const [query,setQuery] = useState(''); const [card,setCard] = useState('');
  const [category,setCategory] = useState(''); const [from,setFrom] = useState(''); const [to,setTo] = useState('');
  const [minimum,setMinimum] = useState(''); const [maximum,setMaximum] = useState(''); const [direction,setDirection] = useState('');
  const [sort,setSort] = useState('date'); const [order,setOrder] = useState('desc'); const [page,setPage] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const cards = useLiveData<Card[]>(endpoints.cards).data || [];
  const categories = useLiveData<CategoryResponse>(endpoints.categories).data?.breakdown || [];
  useEffect(() => { const timer = setTimeout(() => setQuery(search), 250); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { const listener = (event: KeyboardEvent) => { if (event.key === '/' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown',listener); return () => window.removeEventListener('keydown',listener); }, []);
  useEffect(() => setPage(0), [query,card,category,from,to,minimum,maximum,direction,sort,order]);
  const path = useMemo(() => {
    const params = new URLSearchParams({ limit:'50', offset:String(page*50), sort_by:sort, sort_order:order });
    if (query) params.set('search',query);
    if (card) params.set('card',card);
    if (category) params.set('category',category);
    if (from) params.set('from',from);
    if (to) params.set('to',to);
    if (minimum) params.set('amount_min',minimum);
    if (maximum) params.set('amount_max',maximum);
    if (direction) params.set('direction',direction);
    return `/api/transactions?${params}`;
  }, [query,card,category,from,to,minimum,maximum,direction,sort,order,page]);
  const result = useLiveQuery<Response>(path);
  const rows = result.data?.transactions || [];
  const total = result.data?.total || 0;
  return <section className="card"><div className="section-title-row"><div><div className="section-title">Transaction explorer</div><div className="muted" style={{fontSize:12,marginTop:4}}>{result.data ? `${total} transactions` : 'Loading transactions…'}</div></div><input ref={searchRef} className="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search transactions, merchants or categories" aria-label="Search transactions" /></div>
    <div className="filter-bar"><select value={card} onChange={event=>setCard(event.target.value)} aria-label="Filter by card"><option value="">All cards</option>{cards.map(item=><option value={item.id} key={item.id}>{item.name || bankLabel(item.bank)} ··{item.last4}</option>)}</select><select value={category} onChange={event=>setCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map(item=><option value={item.category} key={item.category}>{item.category.replaceAll('_',' ')}</option>)}</select><select value={direction} onChange={event=>setDirection(event.target.value)} aria-label="Filter by direction"><option value="">All directions</option><option value="outgoing">Outgoing</option><option value="incoming">Incoming</option></select><input type="date" value={from} onChange={event=>setFrom(event.target.value)} aria-label="From date"/><input type="date" value={to} onChange={event=>setTo(event.target.value)} aria-label="To date"/><input type="number" min="0" value={minimum} onChange={event=>setMinimum(event.target.value)} placeholder="Min ₹" aria-label="Minimum amount"/><input type="number" min="0" value={maximum} onChange={event=>setMaximum(event.target.value)} placeholder="Max ₹" aria-label="Maximum amount"/><select value={sort} onChange={event=>setSort(event.target.value)} aria-label="Sort transactions"><option value="date">Date</option><option value="amount">Amount</option><option value="category">Category</option></select><button className="filter-order" type="button" onClick={()=>setOrder(order==='desc'?'asc':'desc')} aria-label="Reverse sort order">{order==='desc'?'Newest / highest ↓':'Oldest / lowest ↑'}</button></div>
    {result.error && !result.data ? <div className="empty">ST Finance temporarily unavailable. Retrying automatically…</div> : !result.data ? <div className="loading" style={{marginTop:22}}/> : rows.length ? <div className="transaction-list">{rows.map(item=><div className="transaction-row" key={item.id}><div className="merchant-mark">{item.merchant?.slice(0,1).toUpperCase() || '•'}</div><div className="transaction-main"><strong>{item.merchant || 'Unknown merchant'}</strong><small>{(item.category || 'Other').replaceAll('_',' ')} · {bankLabel(item.bank)} ··{item.cardLast4}</small><small>{formatDate(item.date)}</small></div><div className="transaction-amount">{formatCurrency(item.amount,item.currency||'INR')}</div></div>)}</div> : <div className="empty">No matching transactions. Once a statement is processed, activity will appear here.</div>}
    {total > 50 && <div className="pager"><button type="button" disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {Math.ceil(total/50)}</span><button type="button" disabled={(page+1)*50>=total} onClick={()=>setPage(page+1)}>Next</button></div>}
  </section>;
}

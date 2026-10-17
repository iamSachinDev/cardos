import { bankClass, bankLabel, formatCurrency, formatDate, upcomingDues } from '../lib/api';
import type { Card, DueItem, Statement, Transaction } from '../lib/api';
import { endpoints, useLiveData } from '../lib/live';

type Summary = { cardBreakdown?: { bank: string; last4: string; amount: number; count: number; currency?: string }[] };
export default function CardDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  const cardState = useLiveData<Card[]>(endpoints.cards);
  const cards = cardState.data;
  const summary = useLiveData<Summary>(endpoints.summary).data;
  const reminders = useLiveData<{items:DueItem[]}>(endpoints.dues).data;
  const transactions = useLiveData<{transactions:Transaction[]}>(endpoints.transactions).data?.transactions || [];
  const statements = useLiveData<{statements:Statement[]}>(endpoints.statements).data?.statements || [];
  if (!cards) return <div className="card">{cardState.error ? 'Burnrate temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  const card = cards.find(item => item.id === id);
  if (!card) return <div className="empty">Card not found in Burnrate. <a href="/cards">Return to wallet</a></div>;
  const spent = summary?.cardBreakdown?.find(item => item.bank === card.bank && item.last4 === card.last4);
  const due = upcomingDues(reminders?.items,cards).find(item => item.cardId === card.id);
  const txns = transactions.filter(item => item.bank === card.bank && item.cardLast4 === card.last4);
  const docs = statements.filter(item => item.bank === card.bank && (item.cardLast4 || item.card_last4) === card.last4);
  return <><a className="back-link" href="/cards">← Cards</a><div className="detail-grid"><div className={`wallet-card bank-card ${bankClass(card.bank)}`}><div className="wallet-top">{bankLabel(card.bank)}<span className="wallet-chip"/></div><div><div className="wallet-name">{card.name || 'Credit Card'}</div><div className="wallet-digits">•••• {card.last4}</div></div><div className="wallet-foot">Local Burnrate card</div></div><div className="card detail-metrics"><div><div className="metric-label">Imported spend</div><div className="metric-value">{formatCurrency(summary ? spent?.amount ?? 0 : undefined,spent?.currency||'INR')}</div></div><div><div className="metric-label">Next payment</div><div className="metric-value">{due ? formatCurrency(due.totalAmountDue,due.currency||'INR') : 'Unknown'}</div><div className="muted">{due ? formatDate(due.dueDate) : 'No due date recorded'}</div></div><div className="metric-sub">Annual fee · Unknown</div></div></div>
    <div className="grid grid-2 section"><section className="card"><div className="section-title">Transactions</div>{txns.length ? txns.slice(0,8).map(item=><div className="simple-row" key={item.id}><div><strong>{item.merchant}</strong><small>{formatDate(item.date)}</small></div><strong>{formatCurrency(item.amount,item.currency||'INR')}</strong></div>) : <div className="empty">No transactions for this card yet.</div>}</section><section className="card"><div className="section-title">Statements</div>{docs.length ? docs.map(item=><div className="simple-row" key={item.id}><div><strong>{formatDate(item.periodEnd||item.period_end)}</strong><small>{item.status || 'Unknown status'}</small></div><strong>{formatCurrency(item.totalAmountDue??item.total_amount_due,item.currency||'INR')}</strong></div>) : <div className="empty">No statements for this card yet.</div>}</section></div>
  </>;
}

import { bankLabel, daysUntilDate, formatCurrency, formatDate, upcomingDues } from '../lib/api';
import type { Card, DueItem } from '../lib/api';
import { endpoints, useLiveData } from '../lib/live';

export default function BillsView() {
  const reminderState = useLiveData<{ items: DueItem[] }>(endpoints.dues);
  const cardState = useLiveData<Card[]>(endpoints.cards);
  const items = upcomingDues(reminderState.data?.items, cardState.data);
  const total = items.reduce((sum, item) => sum + (item.totalAmountDue || 0), 0);
  if (!reminderState.data && !cardState.data) return <div className="card">{reminderState.error || cardState.error ? 'Burnrate temporarily unavailable. Retrying…' : <><div className="loading"/><div className="loading" style={{marginTop:20,width:'50%'}}/></>}</div>;
  return <>
    <div className="bill-summary card"><div><div className="eyebrow">Upcoming payments</div><div className="hero-amount">{formatCurrency(total)}</div><div className="muted">{items.length} payment{items.length===1?'':'s'} on your timeline</div></div><div className="bill-summary-icon">{items.length}</div></div>
    <section className="card section"><div className="section-title">Payment timeline</div>
      {items.length ? <div className="bill-timeline">{items.map(item => {
        const days = daysUntilDate(item.dueDate);
        const urgency = days < 0 ? 'overdue' : days < 7 ? 'soon' : days < 14 ? 'approaching' : '';
        return <div className={`timeline-entry ${urgency}`} key={`${item.cardId}-${item.dueDate}`}><div className="timeline-date">{formatDate(item.dueDate)}</div><div className="timeline-body"><strong>{bankLabel(item.bank)}</strong><span className="muted">••{item.cardLast4}</span><small>{days < 0 ? 'Past due date' : days === 0 ? 'Due today' : `Due in ${days} days`}{item.usesManualDueDate ? ' · Card setting' : ''}</small></div><div className="timeline-amount">{formatCurrency(item.totalAmountDue,item.currency||'INR')}</div></div>;
      })}</div> : <div className="empty">No upcoming payments recorded in Burnrate.</div>}
    </section>
  </>;
}

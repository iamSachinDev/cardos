import { bankClass, bankLabel, formatCurrency, formatDate, upcomingDues } from '../lib/api';
import type { Card, DueItem } from '../lib/api';
import { endpoints, useLiveData } from '../lib/live';
type Summary = { cardBreakdown?: { bank: string; last4: string; amount: number; count: number; currency?: string }[] };

export default function CardsView() {
  const cardsState = useLiveData<Card[]>(endpoints.cards);
  const summary = useLiveData<Summary>(endpoints.summary).data;
  const reminders = useLiveData<{items:DueItem[]}>(endpoints.dues).data;
  if (!cardsState.data) return cardsState.error ? <div className="card">ST Finance temporarily unavailable. Retrying…</div> : <div className="grid grid-3">{[1,2,3].map(item=><div className="card bank-card" key={item}><div className="loading"/><div className="loading" style={{marginTop:80}}/></div>)}</div>;
  const cards = cardsState.data;
  const spend = new Map((summary?.cardBreakdown || []).map(item => [`${item.bank}:${item.last4}`, item]));
  const dues = upcomingDues(reminders?.items,cards);
  return <><div className="section-title-row"><div className="muted">{cards.length} cards in your local wallet</div><span className="pill">Fees unknown until verified</span></div>
    {cards.length ? <div className="wallet-grid">{cards.map(card => {
      const detail = spend.get(`${card.bank}:${card.last4}`);
      const due = dues.find(item => item.cardId === card.id);
      return <a href={`/cards/detail?id=${encodeURIComponent(card.id)}`} className={`bank-card wallet-card ${bankClass(card.bank)}`} key={card.id} aria-label={`View ${card.name || bankLabel(card.bank)} details`}>
        <div className="wallet-top"><span>{bankLabel(card.bank)}</span><span className="wallet-chip" aria-hidden="true"/></div>
        <div><div className="wallet-name">{card.name || 'Credit Card'}</div><div className="wallet-digits">•••• {card.last4}</div></div>
        <div className="wallet-bottom"><div><small>Imported spend</small><strong>{summary ? detail ? formatCurrency(detail.amount, detail.currency || 'INR') : 'No imported data' : 'Unknown'}</strong></div><div><small>Next due</small><strong>{due ? formatCurrency(due.totalAmountDue,due.currency||'INR') : 'Unknown'}</strong></div></div>
        <div className="wallet-foot"><span>{due ? formatDate(due.dueDate) : 'No due date recorded'}</span><span>{detail ? `${detail.count} transactions` : 'No imported data'}</span></div>
      </a>;
    })}</div> : <div className="empty">No cards yet. Add cards in ST Finance to build your wallet.</div>}
  </>;
}

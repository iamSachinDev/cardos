import { bankLabel, formatCurrency } from '../lib/api';
import type { Card } from '../lib/api';
import { endpoints, useLiveData, useLiveQuery } from '../lib/live';
import { publicAnnualFeeForCard } from '../lib/publicFees';

type Milestone = { id:string; cardId:string; milestoneType?:string; title?:string; currentAmount?:number; targetAmount?:number; remaining?:number; rewardDescription?:string };
export default function FeeOptimizerView() {
  const cardsState = useLiveData<Card[]>(endpoints.cards);
  const milestoneState = useLiveQuery<{milestones:Milestone[]}>('/api/milestones');
  if (!cardsState.data) return <div className="card">{cardsState.error ? 'Burnrate temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  if (!milestoneState.data) return <div className="card">{milestoneState.error ? 'Waiver milestones are temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  const milestones = milestoneState.data?.milestones || [];
  return <><section className="card fee-intro"><div className="eyebrow">Issuer published pricing</div><h2>Standard annual fees</h2><p className="muted">These are published product rates, not your contracted fees. Promotional, lifetime-free and spend-based waiver terms can change the amount you pay. Waiver progress appears only when Burnrate records a matching milestone.</p></section>
    <div className="grid grid-2 section">{cardsState.data.map(card => {
      const waiver = milestones.find(item => item.cardId === card.id && item.milestoneType === 'fee_waiver');
      const published = publicAnnualFeeForCard(card);
      return <article className="card" key={card.id}><div className="section-title-row"><div><div className="section-title">{card.name || bankLabel(card.bank)}</div><div className="muted" style={{fontSize:11,marginTop:4}}>{bankLabel(card.bank)} ··{card.last4}</div></div><span className="pill">Personal fee unverified</span></div>
        {published ? <><div className="metric-label">Published standard annual fee</div><div className="metric-value">{formatCurrency(published.amount)} <span className="muted" style={{fontSize:14}}>+ {published.taxLabel}</span></div><div className="metric-sub">{published.waiver} <a href={published.sourceUrl} target="_blank" rel="noopener noreferrer">Issuer terms ↗</a></div></> : <div className="metric-sub">No matching published product fee found for this card.</div>}
        {waiver ? <><div className="metric-label">{waiver.title || 'Fee waiver milestone'}</div><div className="metric-value">{formatCurrency(waiver.currentAmount)} <span className="muted" style={{fontSize:14}}> / {formatCurrency(waiver.targetAmount)}</span></div><div className="metric-sub">{formatCurrency(waiver.remaining)} remaining{waiver.rewardDescription ? ` · ${waiver.rewardDescription}` : ''}</div></> : <div className="metric-sub">No verified waiver milestone recorded.</div>}
      </article>;
    })}</div>
  </>;
}

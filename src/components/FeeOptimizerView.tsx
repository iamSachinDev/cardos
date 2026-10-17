import { bankLabel, formatCurrency } from '../lib/api';
import type { Card } from '../lib/api';
import { endpoints, useLiveData, useLiveQuery } from '../lib/live';

type Milestone = { id:string; cardId:string; milestoneType?:string; title?:string; currentAmount?:number; targetAmount?:number; remaining?:number; rewardDescription?:string };
export default function FeeOptimizerView() {
  const cardsState = useLiveData<Card[]>(endpoints.cards);
  const milestoneState = useLiveQuery<{milestones:Milestone[]}>('/api/milestones');
  if (!cardsState.data) return <div className="card">{cardsState.error ? 'Burnrate temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  if (!milestoneState.data) return <div className="card">{milestoneState.error ? 'Waiver milestones are temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  const milestones = milestoneState.data?.milestones || [];
  return <><section className="card fee-intro"><div className="eyebrow">Verified data only</div><h2>Annual fees stay unknown until Burnrate records them.</h2><p className="muted">Waiver progress appears below only when a matching Burnrate milestone exists.</p></section>
    <div className="grid grid-2 section">{cardsState.data.map(card => {
      const waiver = milestones.find(item => item.cardId === card.id && item.milestoneType === 'fee_waiver');
      return <article className="card" key={card.id}><div className="section-title-row"><div><div className="section-title">{card.name || bankLabel(card.bank)}</div><div className="muted" style={{fontSize:11,marginTop:4}}>{bankLabel(card.bank)} ··{card.last4}</div></div><span className="pill">Fee Unknown</span></div>
        {waiver ? <><div className="metric-label">{waiver.title || 'Fee waiver milestone'}</div><div className="metric-value">{formatCurrency(waiver.currentAmount)} <span className="muted" style={{fontSize:14}}> / {formatCurrency(waiver.targetAmount)}</span></div><div className="metric-sub">{formatCurrency(waiver.remaining)} remaining{waiver.rewardDescription ? ` · ${waiver.rewardDescription}` : ''}</div></> : <div className="metric-sub">No verified waiver milestone recorded.</div>}
      </article>;
    })}</div>
  </>;
}

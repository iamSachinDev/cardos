import { useState } from 'react';
import { bankLabel, formatCurrency } from '../lib/api';
import type { Card, PersonalAnnualFeeBasis } from '../lib/api';
import { apiMutate, endpoints, useLiveData, useLiveQuery } from '../lib/live';
import { personalAnnualFeeLabel, publicAnnualFeeForCard } from '../lib/publicFees';
import '../styles/optimize.css';

type Milestone = { id:string; cardId:string; milestoneType?:string; title?:string; currentAmount?:number; targetAmount?:number; remaining?:number; rewardDescription?:string };

function PersonalFeeEditor({ card }: { card: Card }) {
  const [basis, setBasis] = useState<PersonalAnnualFeeBasis | ''>(card.personalAnnualFeeBasis || '');
  const [amount, setAmount] = useState(card.personalAnnualFeeBasis === 'confirmed_amount' ? String(card.personalAnnualFeeAmount ?? '') : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const feeAmount = basis === 'confirmed_amount' ? Number(amount) : basis ? 0 : null;
    if (basis === 'confirmed_amount' && (!amount.trim() || feeAmount === null || !Number.isFinite(feeAmount) || feeAmount < 0)) {
      setMessage('Enter a valid annual fee amount.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await apiMutate(`/api/cards/${encodeURIComponent(card.id)}`, 'PATCH', {
        personal_annual_fee_amount: feeAmount,
        personal_annual_fee_basis: basis || null,
      });
      setMessage('Saved locally for this card.');
    } catch {
      setMessage('Could not save the fee. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return <details className="metric-sub"><summary>Record this card’s personal fee</summary>
    <p>Check your SBI Card account or written offer first. A lifetime-free offer and one renewal waiver are different.</p>
    <form className="opt-form" onSubmit={save}>
      <label>Fee status<select value={basis} onChange={event => { setBasis(event.target.value as PersonalAnnualFeeBasis | ''); setMessage(''); }} disabled={busy}>
        <option value="">Not confirmed</option>
        <option value="lifetime_free">No annual fee · lifetime free</option>
        <option value="annual_waiver">This renewal fee was waived</option>
        <option value="confirmed_amount">Confirmed annual fee amount</option>
      </select></label>
      {basis === 'confirmed_amount' && <label>Annual fee in ₹<input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} disabled={busy} required /></label>}
      <div className="opt-form-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save fee status'}</button><span role="status" aria-live="polite">{message}</span></div>
    </form>
  </details>;
}

export default function FeeOptimizerView() {
  const cardsState = useLiveData<Card[]>(endpoints.cards);
  const milestoneState = useLiveQuery<{milestones:Milestone[]}>('/api/milestones');
  if (!cardsState.data) return <div className="card">{cardsState.error ? 'ST Finance temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  if (!milestoneState.data) return <div className="card">{milestoneState.error ? 'Waiver milestones are temporarily unavailable. Retrying…' : <div className="loading"/>}</div>;
  const milestones = milestoneState.data?.milestones || [];
  return <><section className="card fee-intro"><div className="eyebrow">Annual fee status</div><h2>Your fee needs confirmation</h2><p className="muted">Issuer prices are reference rates, not proof of what your card costs. SBI cards can have individual fee-free or waived offers. Record a personal fee only after checking your card account or written terms.</p></section>
    <div className="grid grid-2 section">{cardsState.data.map(card => {
      const waiver = milestones.find(item => item.cardId === card.id && item.milestoneType === 'fee_waiver');
      const published = publicAnnualFeeForCard(card);
      const personalRecorded = card.personalAnnualFeeBasis != null && card.personalAnnualFeeBasis !== 'annual_waiver' && card.personalAnnualFeeAmount != null;
      return <article className="card" key={card.id}><div className="section-title-row"><div><div className="section-title">{card.name || bankLabel(card.bank)}</div><div className="muted" style={{fontSize:11,marginTop:4}}>{bankLabel(card.bank)} ··{card.last4}</div></div><span className="pill">{personalRecorded ? 'Personal fee recorded' : 'Personal fee unconfirmed'}</span></div>
        {card.bank === 'sbi' ? <><div className="metric-label">Your annual fee</div><div className="metric-value">{personalRecorded ? formatCurrency(card.personalAnnualFeeAmount) : 'Not confirmed'}</div><div className="metric-sub">{card.personalAnnualFeeBasis ? personalAnnualFeeLabel(card) : 'We cannot tell which SBI card has a fee-free offer from the imported statements.'}</div>
          {published && <details className="metric-sub"><summary>See issuer standard fee (may not apply)</summary><div>{formatCurrency(published.amount)} + {published.taxLabel} · {published.waiver} <a href={published.sourceUrl} target="_blank" rel="noopener noreferrer">Issuer terms ↗</a></div></details>}
          <PersonalFeeEditor card={card} /></> : published ? <><div className="metric-label">Published standard annual fee</div><div className="metric-value">{formatCurrency(published.amount)} <span className="muted" style={{fontSize:14}}>+ {published.taxLabel}</span></div><div className="metric-sub">{published.waiver} <a href={published.sourceUrl} target="_blank" rel="noopener noreferrer">Issuer terms ↗</a></div></> : <div className="metric-sub">No matching published product fee found for this card.</div>}
        {waiver ? <><div className="metric-label">{waiver.title || 'Fee waiver milestone'}</div><div className="metric-value">{formatCurrency(waiver.currentAmount)} <span className="muted" style={{fontSize:14}}> / {formatCurrency(waiver.targetAmount)}</span></div><div className="metric-sub">{formatCurrency(waiver.remaining)} remaining{waiver.rewardDescription ? ` · ${waiver.rewardDescription}` : ''}</div></> : <div className="metric-sub">No verified waiver milestone recorded.</div>}
      </article>;
    })}</div>
  </>;
}

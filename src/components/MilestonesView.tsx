import { ArrowUpRight, Flag, Target } from 'lucide-react';
import { bankLabel, formatCurrency } from '../lib/api';
import type { Card } from '../lib/api';
import { endpoints, useLiveData, useLiveQuery } from '../lib/live';
import '../styles/optimize.css';

type Milestone = {
  id?: string;
  cardId?: string;
  title?: string;
  targetAmount?: number;
  currentAmount?: number;
  remaining?: number;
  percent?: number;
  periodKind?: string;
  milestoneType?: string;
  rewardDescription?: string | null;
};
type MilestoneResponse = { milestones?: Milestone[]; total?: number };

const humanize = (value: string) => value.replaceAll('_', ' ');

export default function MilestonesView() {
  const state = useLiveQuery<MilestoneResponse>('/api/milestones');
  const cards = useLiveData<Card[]>(endpoints.cards).data || [];
  const milestones = state.data?.milestones || [];

  if (state.loading && !state.data) return <div className="opt-grid" aria-label="Loading milestones">{[0, 1].map(index => <div className="opt-panel opt-skeleton" key={index}><div className="loading" /><div className="loading" /></div>)}</div>;
  if (state.error && !state.data) return <div className="opt-empty"><Target size={24} /><h2>Milestones are temporarily unavailable</h2><p>ST Finance will reconnect to your local data automatically.</p></div>;

  return <div className="opt-page">
    <section className="opt-feature">
      <div className="opt-feature-icon"><Flag size={25} strokeWidth={1.7} /></div>
      <div><div className="eyebrow">Card goals</div><h2>Your next milestone</h2><p>Track the targets and benefits recorded in ST Finance. Amounts appear here only when a milestone has been set up.</p></div>
      <div className="opt-feature-count"><strong>{state.data?.total ?? milestones.length}</strong><span>tracked</span></div>
    </section>
    {milestones.length ? <div className="opt-grid section">{milestones.map((item, index) => {
      const card = cards.find(entry => entry.id === item.cardId);
      return <article className="opt-panel" key={item.id || `${item.cardId}-${index}`}>
        <div className="opt-panel-top"><span className="opt-icon"><Target size={18} /></span><span className="opt-tag">{humanize(item.milestoneType || 'milestone')}</span></div>
        <h3>{item.title || 'Card milestone'}</h3>
        {card && <p className="opt-secondary">{bankLabel(card.bank)} · {card.name || `••${card.last4}`}</p>}
        <div className="opt-data"><span>Progress</span><strong>{formatCurrency(item.currentAmount)} / {formatCurrency(item.targetAmount)}</strong></div>
        {item.remaining != null && <div className="opt-data"><span>Remaining</span><strong>{formatCurrency(item.remaining)}</strong></div>}
        {item.periodKind && <div className="opt-data"><span>Period</span><strong className="opt-small">{humanize(item.periodKind)}</strong></div>}
        {item.rewardDescription && <p className="opt-note">{item.rewardDescription}</p>}
      </article>;
    })}</div> : <div className="opt-empty section"><Target size={26} strokeWidth={1.6} /><h2>No milestones recorded yet</h2><p>When you add a card milestone, its verified target and benefit will appear here.</p><a href="/cards">Explore your cards <ArrowUpRight size={16} /></a></div>}
  </div>;
}

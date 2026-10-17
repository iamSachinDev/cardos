import { ArrowUpRight, Gift, Tag } from 'lucide-react';
import { bankLabel, formatCurrency, formatDate } from '../lib/api';
import { useLiveQuery } from '../lib/live';
import '../styles/optimize.css';

type Offer = {
  id?: string;
  title?: string;
  description?: string | null;
  merchant?: string | null;
  discountText?: string | null;
  offerType?: string | null;
  bank?: string | null;
  category?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  minTransaction?: number | null;
  maxDiscount?: number | null;
};
type OfferResponse = { offers?: Offer[]; total?: number; lastSyncAt?: string | null };

export default function OffersView() {
  const state = useLiveQuery<OfferResponse>('/api/offers');
  const offers = state.data?.offers || [];

  if (state.loading && !state.data) return <div className="opt-grid" aria-label="Loading offers">{[0, 1].map(index => <div className="opt-panel opt-skeleton" key={index}><div className="loading" /><div className="loading" /></div>)}</div>;
  if (state.error && !state.data) return <div className="opt-empty"><Gift size={24} /><h2>Offers are temporarily unavailable</h2><p>CardOS will reconnect to your local Burnrate data automatically.</p></div>;

  return <div className="opt-page">
    <section className="opt-feature"><div className="opt-feature-icon"><Gift size={25} strokeWidth={1.7} /></div><div><div className="eyebrow">Card benefits</div><h2>Offers, close at hand</h2><p>See the offers available in your local Burnrate collection.</p></div><div className="opt-feature-count"><strong>{state.data?.total ?? offers.length}</strong><span>offers</span></div></section>
    {offers.length ? <div className="opt-grid section">{offers.map((offer, index) => <article className="opt-panel" key={offer.id || `${offer.title}-${index}`}>
      <div className="opt-panel-top"><span className="opt-icon"><Tag size={18} /></span>{offer.offerType && <span className="opt-tag">{offer.offerType.replaceAll('_', ' ')}</span>}</div>
      <h3>{offer.title || 'Card offer'}</h3>
      {(offer.merchant || offer.bank) && <p className="opt-secondary">{[offer.merchant, offer.bank ? bankLabel(offer.bank) : null].filter(Boolean).join(' · ')}</p>}
      {offer.discountText && <div className="opt-highlight">{offer.discountText}</div>}
      {offer.description && <p className="opt-note">{offer.description}</p>}
      {offer.minTransaction != null && <div className="opt-data"><span>Minimum spend</span><strong className="opt-small">{formatCurrency(offer.minTransaction)}</strong></div>}
      {offer.maxDiscount != null && <div className="opt-data"><span>Maximum discount</span><strong className="opt-small">{formatCurrency(offer.maxDiscount)}</strong></div>}
      {offer.validUntil && <div className="opt-data"><span>Valid until</span><strong className="opt-small">{formatDate(offer.validUntil)}</strong></div>}
    </article>)}</div> : <div className="opt-empty section"><Gift size={26} strokeWidth={1.6} /><h2>No offers recorded yet</h2><p>Offers added in Burnrate will appear here. Your cards and spending data are available in the meantime.</p><a href="/cards">Explore your cards <ArrowUpRight size={16} /></a></div>}
  </div>;
}

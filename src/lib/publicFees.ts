import type { Card } from './api';

/** Published product pricing only. It does not describe this cardholder's offer. */
export type PublicAnnualFee = {
  amount: number;
  taxLabel: string;
  sourceUrl: string;
  waiver: string;
};

const publicFees = {
  axisRewards: {
    amount: 1000, taxLabel: 'GST',
    sourceUrl: 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/terms-and-conditions-for-axis-bank-rewards-credit-card.pdf',
    waiver: 'Published renewal waiver: ₹2 lakh eligible spend in the anniversary year for cards issued from 1 Mar 2023. Migrated cards may have different terms.',
  },
  hdfcRegaliaGold: {
    amount: 2500, taxLabel: 'applicable taxes',
    sourceUrl: 'https://www.hdfc.bank.in/credit-cards/regalia-gold-credit-card/fees-and-charges',
    waiver: 'Published renewal waiver: ₹4 lakh spend within 12 billing cycles of the anniversary year.',
  },
  hdfcUpiRupay: {
    amount: 99, taxLabel: 'applicable taxes',
    sourceUrl: 'https://www.hdfc.bank.in/credit-cards/hdfc-bank-upi-rupay-credit-card/fees-and-charges',
    waiver: 'Published renewal waiver: ₹25,000 eligible annual spend before renewal, from the second year.',
  },
  iciciHpclCoral: {
    amount: 199, taxLabel: 'GST',
    sourceUrl: 'https://www.icici.bank.in/personal-banking/cards/credit-card/hpcl-coral-credit-card',
    waiver: 'Published renewal waiver: ₹50,000 annual spend. Promotional or lifetime-free offers may differ.',
  },
  scSuperValueTitanium: {
    amount: 750, taxLabel: 'applicable GST',
    sourceUrl: 'https://www.sc.bank.in/credit-cards/tariffs-and-charges/',
    waiver: 'The published tariff gives no standard spend waiver. Promotional and Premium Banking terms may differ.',
  },
  sbiSimplySave: {
    amount: 499, taxLabel: 'applicable taxes',
    sourceUrl: 'https://www.sbicard.com/en/most-important-terms-and-conditions.page',
    waiver: 'Published renewal waiver: ₹1 lakh or more spent in the preceding year.',
  },
  sbiSimplyClick: {
    amount: 499, taxLabel: 'applicable taxes',
    sourceUrl: 'https://www.sbicard.com/en/most-important-terms-and-conditions.page',
    waiver: 'Published renewal waiver: ₹1 lakh or more spent in the preceding year.',
  },
} satisfies Record<string, PublicAnnualFee>;

export function publicAnnualFeeForCard(card: Pick<Card, 'bank' | 'name'>): PublicAnnualFee | null {
  const bank = card.bank.toLowerCase();
  const name = (card.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  if (bank === 'axis' && /\brewards?\b/.test(name)) return publicFees.axisRewards;
  if (bank === 'hdfc' && /\bregalia gold\b/.test(name)) return publicFees.hdfcRegaliaGold;
  if (bank === 'hdfc' && /\bupi\b/.test(name) && /\brupay\b/.test(name) && !/\b(mega saver|biz)\b/.test(name)) return publicFees.hdfcUpiRupay;
  if (bank === 'icici' && /\bhpcl coral\b/.test(name)) return publicFees.iciciHpclCoral;
  if (bank === 'sc' && /\bsuper\s*value titanium\b/.test(name)) return publicFees.scSuperValueTitanium;
  if (bank === 'sbi' && /\bsimply\s*save\b/.test(name)) return publicFees.sbiSimplySave;
  if (bank === 'sbi' && /\bsimply\s*click\b/.test(name)) return publicFees.sbiSimplyClick;
  return null;
}

export function personalAnnualFeeLabel(card: Card): string {
  if (card.personalAnnualFeeBasis === 'lifetime_free') return 'No annual fee · lifetime free';
  if (card.personalAnnualFeeBasis === 'annual_waiver') return 'Renewal waiver recorded · check current period';
  if (card.personalAnnualFeeBasis === 'confirmed_amount' && card.personalAnnualFeeAmount != null) {
    return `Recorded annual fee · ₹${card.personalAnnualFeeAmount.toLocaleString('en-IN')}`;
  }
  return 'Not confirmed';
}

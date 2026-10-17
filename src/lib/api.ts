export type Card = { id: string; bank: string; last4: string; name?: string; manualNextDueDate?: string | null; manualNextDueAmount?: number | null };
export type DueItem = { cardId: string; bank: string; cardLast4: string; statementId: string | null; dueDate: string; totalAmountDue: number | null; currency: string; usesManualDueDate: boolean };
export type Transaction = { id: string; date: string; merchant: string; amount: number; type: string; category: string; bank: string; cardLast4: string; currency?: string; tags?: string[] };
export type Statement = { id: string; bank: string; card_last4?: string; cardLast4?: string; period_start?: string; periodStart?: string; period_end?: string; periodEnd?: string; transaction_count?: number; transactionCount?: number; total_spend?: number; totalSpend?: number; total_amount_due?: number | null; totalAmountDue?: number | null; payment_due_date?: string | null; paymentDueDate?: string | null; status?: string; file_name?: string | null; fileName?: string | null; imported_at?: string | null; importedAt?: string | null; currency?: string };

export async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error('Burnrate temporarily unavailable');
    return res.json() as Promise<T>;
  } catch {
    throw new Error('Burnrate temporarily unavailable');
  } finally { clearTimeout(timeout); }
}

export function formatCurrency(value: number | null | undefined, currency = 'INR') {
  if (value == null || Number.isNaN(value)) return 'Unknown';
  try { return new Intl.NumberFormat('en-IN', { style:'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `₹${Number(value).toLocaleString('en-IN')}`; }
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

export function localDateISO() {
  const d = new Date();
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export function formatCompactINR(value: number) {
  const absolute = Math.abs(value);
  const divisor = absolute >= 10_000_000 ? 10_000_000 : absolute >= 100_000 ? 100_000 : absolute >= 1000 ? 1000 : 1;
  const suffix = divisor === 10_000_000 ? 'Cr' : divisor === 100_000 ? 'L' : divisor === 1000 ? 'k' : '';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value / divisor)}${suffix}`;
}

export function upcomingDues(items: DueItem[] = [], cards: Card[] = []): DueItem[] {
  const today = localDateISO();
  const result = [...items];
  for (const card of cards) {
    if (!card.manualNextDueDate || card.manualNextDueDate < today) continue;
    const found = result.some(item => item.cardId === card.id && item.dueDate === card.manualNextDueDate);
    if (!found) result.push({ cardId: card.id, bank: card.bank, cardLast4: card.last4,
      statementId: null, dueDate: card.manualNextDueDate, totalAmountDue: card.manualNextDueAmount ?? null,
      currency: 'INR', usesManualDueDate: true });
  }
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export const bankLabel = (bank: string) => ({ hdfc:'HDFC Bank', axis:'Axis Bank', icici:'ICICI Bank', sbi:'SBI Card', sc:'Standard Chartered', amex:'American Express', idfc_first:'IDFC FIRST', indusind:'IndusInd', kotak:'Kotak', yes:'YES Bank', au:'AU Bank', rbl:'RBL Bank', federal:'Federal Bank', indian_bank:'Indian Bank' } as Record<string,string>)[bank] || bank.toUpperCase();
export const bankClass = (bank: string) => ['hdfc','axis','icici','sbi','sc'].includes(bank) ? bank : 'hdfc';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, daysUntilDate, formatCurrency, formatDate, formatDateTime, localDateISO, upcomingDues } from './api';
import type { Card, DueItem } from './api';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-18T18:40:00Z')); // 19 Oct, 00:10 IST
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('IST dates', () => {
  it('uses the IST calendar day across a UTC midnight boundary', () => {
    expect(localDateISO()).toBe('2026-10-19');
    expect(daysUntilDate('2026-10-18')).toBe(-1);
    expect(daysUntilDate('2026-10-20')).toBe(1);
    expect(formatDate('2026-10-19')).toBe('19 Oct 2026');
  });

  it('treats a naive timestamp as UTC and labels the displayed time IST', () => {
    expect(formatDateTime('2026-10-18T20:00:00')).toMatch(/19 Oct 2026.*01:30.*IST/);
    expect(formatDateTime(null)).toBe('—');
    expect(formatDate('invalid')).toBe('invalid');
  });
});

it('adds future manual dues once, excludes past ones, sorts, and leaves inputs untouched', () => {
  const items: DueItem[] = [{ cardId: 'card-a', bank: 'test', cardLast4: 'TEST', statementId: 'statement-a', dueDate: '2026-10-22', totalAmountDue: 100, currency: 'INR', usesManualDueDate: false }];
  const cards: Card[] = [
    { id: 'card-a', bank: 'test', last4: 'TEST', manualNextDueDate: '2026-10-22', manualNextDueAmount: 100 },
    { id: 'card-b', bank: 'test', last4: 'TEST', manualNextDueDate: '2026-10-20', manualNextDueAmount: 200 },
    { id: 'card-c', bank: 'test', last4: 'TEST', manualNextDueDate: '2026-10-18', manualNextDueAmount: 300 },
  ];
  const result = upcomingDues(items, cards);
  expect(result.map((due) => due.cardId)).toEqual(['card-b', 'card-a']);
  expect(result[0]).toMatchObject({ statementId: null, usesManualDueDate: true, totalAmountDue: 200 });
  expect(items).toHaveLength(1);
});

it('keeps missing amounts explicit and falls back safely for an unsupported currency', () => {
  expect(formatCurrency(null)).toBe('Unknown');
  expect(formatCurrency(Number.NaN)).toBe('Unknown');
  expect(formatCurrency(1234, 'not-a-currency')).toContain('₹');
});

it('requests JSON without caching and normalizes HTTP failures', async () => {
  const fetchMock = vi.fn(async () => Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(apiGet('/api/synthetic')).resolves.toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith('/api/synthetic', expect.objectContaining({ cache: 'no-store', headers: { Accept: 'application/json' }, signal: expect.any(AbortSignal) }));
  expect(vi.getTimerCount()).toBe(0);

  fetchMock.mockImplementation(async () => new Response(null, { status: 503 }));
  await expect(apiGet('/api/synthetic')).rejects.toThrow('ST Finance temporarily unavailable');
  expect(vi.getTimerCount()).toBe(0);
});

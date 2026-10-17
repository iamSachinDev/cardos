import { useEffect, useSyncExternalStore } from 'react';
import { apiGet, localDateISO } from './api';

export const endpoints = {
  settings: '/api/settings',
  cards: '/api/cards',
  statements: '/api/statements?limit=200&sort_by=period_end&sort_order=desc',
  processing: '/api/statements/processing-logs?unread_only=false',
  transactions: '/api/transactions?limit=250&sort_by=date&sort_order=desc',
  summary: '/api/analytics/summary',
  trends: '/api/analytics/trends',
  categories: '/api/analytics/categories',
  merchants: '/api/analytics/merchants',
  gmail: '/api/gmail/status',
  get dues() { return `/api/due-reminders?local_date=${localDateISO()}`; },
};

type Snapshot<T = unknown> = { data?: T; error?: boolean; loading: boolean; updatedAt?: number };
type Connection = { state: 'connecting' | 'connected' | 'refreshing' | 'offline' | 'error'; updatedAt?: number };
const entries = new Map<string, Snapshot>();
const listeners = new Set<() => void>();
const pending = new Map<string, Promise<unknown>>();
const activePaths = new Map<string, number>();
let connection: Connection = { state: 'connecting' };
let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let fastTimer: ReturnType<typeof setTimeout> | undefined;
let failures = 0;
let activeRefresh: Promise<void> | undefined;
let statementSignature = '';
let processingSignature = '';
const emptySnapshot: Snapshot = { loading: true };

function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function snapshot<T>(path: string): Snapshot<T> { return (entries.get(path) || emptySnapshot) as Snapshot<T>; }
function connectionSnapshot() { return connection; }

async function fetchOnce(path: string): Promise<unknown> {
  const existing = pending.get(path);
  if (existing) return existing;
  const request = apiGet(path).finally(() => pending.delete(path));
  pending.set(path, request);
  return request;
}

function statementFingerprint(value: unknown) {
  const result = value as { statements?: Array<{ id?: string; status?: string; updated_at?: string; imported_at?: string; transaction_count?: number }> };
  return JSON.stringify((result.statements || []).map(row => [row.id, row.status, row.updated_at, row.imported_at, row.transaction_count]));
}

function hasProcessingStatement() {
  const data = snapshot<{ statements?: Array<{ status?: string }> }>(endpoints.statements).data;
  const logs = snapshot<Array<{ status?: string }>>(endpoints.processing).data;
  return [...(data?.statements || []), ...(logs || [])].some(row => ['processing', 'pending', 'queued', 'parsing'].includes(row.status || ''));
}

function schedule() {
  clearTimeout(timer);
  clearTimeout(fastTimer);
  if (!started || typeof document === 'undefined' || document.hidden) return;
  timer = setTimeout(() => { void refreshAll('automatic'); }, failures ? Math.min(60_000, 5_000 * 2 ** Math.min(failures, 4)) : 45_000);
  if (!failures && hasProcessingStatement()) {
    fastTimer = setTimeout(() => { void refreshStatements(); }, 5_000);
  }
}

async function refreshStatements() {
  const results = await Promise.allSettled([fetchOnce(endpoints.statements), fetchOnce(endpoints.processing)]);
  const previous = `${statementSignature}|${processingSignature}`;
  results.forEach((response, index) => {
    if (response.status !== 'fulfilled') return;
    const path = index ? endpoints.processing : endpoints.statements;
    entries.set(path, { data: response.value, loading: false, updatedAt: Date.now() });
    if (index) processingSignature = JSON.stringify(response.value);
    else statementSignature = statementFingerprint(response.value);
  });
  if (results.every(result => result.status === 'fulfilled')) {
    connection = { state: 'connected', updatedAt: Date.now() };
    emit();
    if (previous !== '|' && previous !== `${statementSignature}|${processingSignature}`) {
      if (activeRefresh) await activeRefresh;
      await refreshAll('change');
      return;
    }
  } else {
    failures++;
    connection = { ...connection, state: 'error' };
    emit();
  }
  schedule();
}

export async function refreshAll(_reason: 'startup' | 'automatic' | 'focus' | 'manual' | 'change' | 'mutation' = 'manual') {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    connection = { ...connection, state: connection.updatedAt ? 'refreshing' : 'connecting' };
    emit();
    const paths = [...new Set([endpoints.settings, endpoints.cards, endpoints.dues, endpoints.statements, endpoints.processing, endpoints.transactions,
      endpoints.summary, endpoints.trends, endpoints.categories, endpoints.merchants, endpoints.gmail, ...activePaths.keys()])];
    const results = await Promise.allSettled(paths.map(fetchOnce));
    let successes = 0;
    results.forEach((result, index) => {
      const path = paths[index];
      const previous = entries.get(path);
      if (result.status === 'fulfilled') {
        successes++;
        entries.set(path, { data: result.value, loading: false, updatedAt: Date.now() });
        if (path === endpoints.statements) statementSignature = statementFingerprint(result.value);
        if (path === endpoints.processing) processingSignature = JSON.stringify(result.value);
      } else {
        entries.set(path, { ...previous, loading: false, error: true });
      }
    });
    failures = successes === paths.length ? 0 : failures + 1;
    const settingsAvailable = results[0].status === 'fulfilled';
    connection = successes === paths.length ? { state: 'connected', updatedAt: Date.now() }
      : settingsAvailable ? { state: 'error', updatedAt: Date.now() }
      : { state: 'offline', updatedAt: connection.updatedAt };
    emit();
  })().finally(() => { activeRefresh = undefined; schedule(); });
  return activeRefresh;
}

export function startLiveSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  void refreshAll('startup');
  const onFocus = () => { if (!document.hidden) void refreshAll('focus'); };
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
}

export function useLiveData<T>(path: string): Snapshot<T> {
  return useSyncExternalStore(subscribe, () => snapshot<T>(path), () => emptySnapshot as Snapshot<T>);
}

export function useLiveQuery<T>(path: string): Snapshot<T> {
  const result = useLiveData<T>(path);
  useEffect(() => {
    activePaths.set(path, (activePaths.get(path) || 0) + 1);
    void fetchOnce(path).then(data => {
      entries.set(path, { data, loading: false, updatedAt: Date.now() }); emit();
    }).catch(() => { entries.set(path, { ...entries.get(path), loading: false, error: true }); emit(); });
    return () => {
      const count = (activePaths.get(path) || 1) - 1;
      if (count) activePaths.set(path, count);
      else { activePaths.delete(path); if (!Object.values(endpoints).includes(path)) entries.delete(path); }
    };
  }, [path]);
  return result;
}

export function useConnection(): Connection {
  return useSyncExternalStore(subscribe, connectionSnapshot, () => ({ state: 'connecting' }));
}

export async function apiMutate(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch { throw new Error('Burnrate could not complete that action.'); }
  finally { clearTimeout(timeout); }
  if (!response.ok) throw new Error('Burnrate could not complete that action.');
  const result = response.status === 204 ? null : await response.json();
  if (activeRefresh) await activeRefresh;
  await refreshAll('mutation');
  return result;
}

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Read snapshots directly without mounting a browser. Each test imports a fresh singleton module.
vi.mock('react', () => ({ useEffect: vi.fn(), useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot() }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-18T18:40:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('reports connected after a fully mocked refresh and keeps previous data on a partial failure', async () => {
  const live = await import('./live');
  let failCards = false;
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    if (failCards && path === live.endpoints.cards) return new Response(null, { status: 503 });
    return Response.json({ marker: path });
  }));

  await live.refreshAll();
  expect(live.useConnection().state).toBe('connected');
  expect(live.useLiveData<{ marker: string }>(live.endpoints.cards).data?.marker).toBe(live.endpoints.cards);

  failCards = true;
  await live.refreshAll();
  expect(live.useConnection().state).toBe('error');
  expect(live.useLiveData<{ marker: string }>(live.endpoints.cards)).toMatchObject({ data: { marker: live.endpoints.cards }, error: true, loading: false });
});

it('reports offline when the settings request fails', async () => {
  const live = await import('./live');
  vi.stubGlobal('fetch', vi.fn(async (path: string) => path === live.endpoints.settings
    ? new Response(null, { status: 503 }) : Response.json({ marker: path })));
  await live.refreshAll();
  expect(live.useConnection().state).toBe('offline');
});

it('sends a JSON mutation, handles 204, and refreshes the snapshots', async () => {
  const live = await import('./live');
  const fetchMock = vi.fn(async (path: string) => path === '/api/synthetic'
    ? new Response(null, { status: 204 }) : Response.json({ marker: path }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(live.apiMutate('/api/synthetic', 'PATCH', { enabled: true })).resolves.toBeNull();
  expect(fetchMock).toHaveBeenCalledWith('/api/synthetic', expect.objectContaining({
    method: 'PATCH', cache: 'no-store', body: '{"enabled":true}',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  }));
  expect(live.useConnection().state).toBe('connected');
});

it('preserves an HTTP mutation status and synthetic detail without refreshing', async () => {
  const live = await import('./live');
  const fetchMock = vi.fn(async () => Response.json({ detail: 'synthetic conflict' }, { status: 409 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(live.apiMutate('/api/synthetic', 'POST')).rejects.toMatchObject({ status: 409, detail: 'synthetic conflict' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

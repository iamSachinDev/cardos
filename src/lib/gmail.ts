import { ApiMutationError, apiMutate } from './live';

export type GmailStatus = { configured: boolean; connected: boolean; last_sync: string | null };
export type GmailSyncResult = { status: string; messages_scanned?: number; attachments_queued?: number };

// The backend returns a Google consent URL; Google then redirects back to /settings?gmail=…
export async function connectGmail() {
  let response: Response;
  try { response = await fetch('/api/gmail/auth/start', { method: 'POST', cache: 'no-store', headers: { Accept: 'application/json' } }); }
  catch { throw new Error('Could not start Gmail sign-in.'); }
  if (!response.ok) throw new Error('Could not start Gmail sign-in.');
  const { auth_url } = await response.json() as { auth_url?: string };
  if (!auth_url || new URL(auth_url).origin !== 'https://accounts.google.com') throw new Error('Received an unexpected sign-in address.');
  window.location.assign(auth_url);
}

export function gmailNeedsReconnect(error: unknown): boolean {
  return error instanceof ApiMutationError && (error.status === 401 ||
    /token refresh failed|reconnect gmail|gmail is not connected|invalid encrypted token|invalid_grant|invalid authentication credentials/i.test(error.detail || ''));
}

export const syncGmail = () => apiMutate('/api/gmail/sync', 'POST', undefined, { timeoutMs: 180_000 }) as Promise<GmailSyncResult>;

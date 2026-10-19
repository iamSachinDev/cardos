import { afterEach, expect, it, vi } from 'vitest';
import { connectGmail, gmailNeedsReconnect } from './gmail';
import { ApiMutationError } from './live';

afterEach(() => vi.unstubAllGlobals());

it('accepts only the Google Accounts origin before navigating', async () => {
  const assign = vi.fn();
  vi.stubGlobal('window', { location: { assign } });
  const authUrl = 'https://accounts.google.com/o/oauth2/auth?state=synthetic';
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ auth_url: authUrl })));
  await connectGmail();
  expect(assign).toHaveBeenCalledWith(authUrl);

  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ auth_url: 'https://accounts.google.com.evil.invalid/auth' })));
  await expect(connectGmail()).rejects.toThrow('unexpected sign-in address');
  expect(assign).toHaveBeenCalledTimes(1);
});

it('recognizes reconnect errors by status or token detail', () => {
  expect(gmailNeedsReconnect(new ApiMutationError(401))).toBe(true);
  expect(gmailNeedsReconnect(new ApiMutationError(400, 'invalid_grant'))).toBe(true);
  expect(gmailNeedsReconnect(new ApiMutationError(403, 'unrelated error'))).toBe(false);
  expect(gmailNeedsReconnect(new Error('invalid_grant'))).toBe(false);
});

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiMutate, endpoints, refreshAll, startLiveSync, useConnection, useLiveData } from '../lib/live';

type GmailStatus = { configured: boolean; connected: boolean; last_sync: string | null };

export default function BurnrateStatus() {
  const connection = useConnection();
  const gmail = useLiveData<GmailStatus>(endpoints.gmail).data;
  const [now, setNow] = useState(Date.now());
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailError, setGmailError] = useState(false);
  useEffect(() => { startLiveSync(); const interval = setInterval(() => setNow(Date.now()), 10_000); return () => clearInterval(interval); }, []);
  const seconds = connection.updatedAt ? Math.max(0, Math.floor((now - connection.updatedAt) / 1000)) : 0;
  const age = seconds < 10 ? 'updated just now' : seconds < 60 ? `updated ${seconds}s ago` : `updated ${Math.floor(seconds / 60)}m ago`;
  const label = connection.state === 'connecting' ? 'Connecting to Burnrate…'
    : connection.state === 'offline' ? 'Burnrate temporarily unavailable · Retrying…'
    : connection.state === 'error' ? 'Burnrate connected · Some data unavailable'
    : connection.state === 'refreshing' ? 'Refreshing local data…'
    : `Burnrate connected · ${age}`;
  return <div className="sync-group">
    <div className={`live-status ${connection.state}`} role="status" aria-live="polite"><span className="status-dot" />
      <span><strong>{label}</strong><small>Local only</small></span></div>
    <button className="sync-button" type="button" onClick={() => void refreshAll('manual')} disabled={connection.state === 'refreshing'} aria-label="Sync with Burnrate">
      <RefreshCw size={15} /> <span>Sync</span>
    </button>
    {gmail && <div className="gmail-status">
      {gmail.configured && gmail.connected ? <button type="button" disabled={gmailBusy} onClick={async () => { setGmailBusy(true); setGmailError(false); try { await apiMutate('/api/gmail/sync', 'POST'); } catch { setGmailError(true); } finally { setGmailBusy(false); } }}>{gmailError ? 'Gmail sync failed · Retry' : 'Sync Gmail'}</button>
        : <span>Gmail auto-sync not configured</span>}
    </div>}
  </div>;
}

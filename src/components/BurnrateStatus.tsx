import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDateTime } from '../lib/api';
import { endpoints, refreshAll, startLiveSync, useConnection, useLiveData } from '../lib/live';
import { connectGmail, syncGmail, type GmailStatus } from '../lib/gmail';

export default function BurnrateStatus() {
  const connection = useConnection();
  const gmail = useLiveData<GmailStatus>(endpoints.gmail).data;
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailError, setGmailError] = useState(false);
  useEffect(() => { startLiveSync(); }, []);
  const lastChecked = connection.updatedAt ? new Date(connection.updatedAt).toISOString() : null;
  const label = connection.state === 'connecting' ? 'Connecting to Burnrate…'
    : connection.state === 'offline' ? 'Burnrate temporarily unavailable · Retrying…'
    : connection.state === 'error' ? 'Burnrate connected · Some data unavailable'
    : connection.state === 'refreshing' ? 'Refreshing local data…'
    : 'Burnrate connected';
  return <div className="sync-group">
    <div className={`live-status ${connection.state}`} role="status" aria-live="polite"><span className="status-dot" />
      <span><strong>{label}</strong><small>{lastChecked ? <>Last checked <time dateTime={lastChecked}>{formatDateTime(lastChecked)}</time></> : 'Local Burnrate connection'}</small></span></div>
    <button className="sync-button" type="button" onClick={() => void refreshAll('manual')} disabled={connection.state === 'refreshing'} aria-label="Sync with Burnrate">
      <RefreshCw size={15} /> <span>Sync</span>
    </button>
    {gmail && <div className="gmail-status">
      {!gmail.configured ? <span>Gmail auto-sync not configured</span>
        : gmail.connected ? <button type="button" disabled={gmailBusy} onClick={async () => { setGmailBusy(true); setGmailError(false); try { await syncGmail(); } catch { setGmailError(true); } finally { setGmailBusy(false); } }}>{gmailError ? 'Gmail sync failed · Retry' : 'Sync Gmail'}</button>
        : <button type="button" disabled={gmailBusy} onClick={async () => { setGmailBusy(true); setGmailError(false); try { await connectGmail(); } catch { setGmailError(true); setGmailBusy(false); } }}>{gmailError ? 'Gmail sign-in failed · Retry' : 'Connect Gmail'}</button>}
    </div>}
  </div>;
}

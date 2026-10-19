import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDateTime } from '../lib/api';
import { endpoints, refreshAll, startLiveSync, useConnection, useLiveData } from '../lib/live';
import { gmailNeedsReconnect, syncGmail, type GmailStatus } from '../lib/gmail';

export default function AppStatus() {
  const connection = useConnection();
  const gmailState = useLiveData<GmailStatus>(endpoints.gmail);
  const gmail = gmailState.data;
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMessage, setGmailMessage] = useState('');
  useEffect(() => { startLiveSync(); }, []);

  const lastChecked = connection.updatedAt ? new Date(connection.updatedAt).toISOString() : null;
  const localState = connection.state === 'connecting' ? 'Connecting…'
    : connection.state === 'offline' ? 'Unavailable · Retrying…'
    : connection.state === 'error' ? 'Some data unavailable'
    : connection.state === 'refreshing' ? 'Refreshing…'
    : 'Connected';

  const checkGmail = async () => {
    setGmailBusy(true);
    setGmailMessage('Checking connected Gmail for statements…');
    try {
      const result = await syncGmail();
      setGmailMessage(`${result.messages_scanned ?? 0} emails checked · ${result.attachments_queued ?? 0} attachments queued for processing`);
    } catch (error) {
      setGmailMessage(gmailNeedsReconnect(error) ? 'Gmail needs reconnecting in Settings.' : 'Gmail check failed. Try again.');
    } finally {
      setGmailBusy(false);
    }
  };

  return <div className="sync-group" aria-label="Data connections">
    <div className="sync-row">
      <div className={`live-status ${connection.state}`} role="status" aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <span><strong>Local data · {localState}</strong><small>{lastChecked ? <>Last data check <time dateTime={lastChecked}>{formatDateTime(lastChecked)}</time></> : 'Waiting for first data check'}</small></span>
      </div>
      <button className="sync-button" type="button" onClick={() => void refreshAll('manual')} disabled={connection.state === 'refreshing'} aria-label="Refresh ST Finance data">
        <RefreshCw size={15} aria-hidden="true" /> <span>Refresh data</span>
      </button>
    </div>
    <div className="sync-row gmail-row">
      <div className={`live-status ${gmail?.configured && gmail.connected ? 'connected' : 'offline'}`} role="status" aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <span><strong>Gmail statements · {!gmail ? gmailState.error ? 'Status unavailable' : 'Checking…' : !gmail.configured ? 'Not set up' : gmail.connected ? 'Connection saved' : 'Not connected'}</strong>
          <small>{gmail?.connected && gmail.last_sync ? <>Last completed check <time dateTime={gmail.last_sync}>{formatDateTime(gmail.last_sync)}</time></> : gmail?.connected ? 'No completed Gmail check yet' : !gmail ? 'Gmail connection status pending' : 'Connect in Settings to check statement email'}</small></span>
      </div>
      {gmail?.configured && gmail.connected
        ? <button className="sync-button" type="button" disabled={gmailBusy} onClick={() => void checkGmail()} aria-label="Check connected Gmail for statements"><RefreshCw size={15} aria-hidden="true" /><span>{gmailBusy ? 'Checking…' : 'Check Gmail'}</span></button>
        : gmail ? <a className="sync-button" href="/settings" aria-label="Open Gmail settings">Gmail settings</a> : null}
    </div>
    {gmailMessage && <div className="gmail-feedback" role="status" aria-live="polite">{gmailMessage}</div>}
  </div>;
}

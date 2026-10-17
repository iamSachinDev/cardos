import { useEffect, useState } from 'react';
import { FolderOpen, Mail, RefreshCw, Save, Settings2 } from 'lucide-react';
import { apiMutate, endpoints, useLiveData } from '../lib/live';
import { connectGmail, gmailNeedsReconnect, syncGmail, type GmailStatus } from '../lib/gmail';
import '../styles/optimize.css';

type BurnrateSettings = {
  setup_complete?: boolean;
  settings?: { name?: string | null; watch_folder?: string | null; display_currency?: string | null };
};
type Draft = { name: string; watch_folder: string; display_currency: string };

export default function SettingsView() {
  const settingsState = useLiveData<BurnrateSettings>(endpoints.settings);
  const gmailState = useLiveData<GmailStatus>(endpoints.gmail);
  const settings = settingsState.data?.settings;
  const gmail = gmailState.data;
  const [draft, setDraft] = useState<Draft>({ name: '', watch_folder: '', display_currency: 'INR' });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMessage, setGmailMessage] = useState('');
  const gmailConnected = Boolean(gmail?.configured && gmail.connected);

  useEffect(() => {
    if (settings && !dirty) setDraft({ name: settings.name || '', watch_folder: settings.watch_folder || '', display_currency: settings.display_currency || 'INR' });
  }, [settings, dirty]);

  const runGmailSync = async (pending = 'Checking Gmail for statements…') => {
    setGmailBusy(true); setGmailMessage(pending);
    try { const result = await syncGmail(); setGmailMessage(`Queued ${result.attachments_queued ?? 0} attachments from ${result.messages_scanned ?? 0} emails for processing.`); }
    catch (error) { setGmailMessage(gmailNeedsReconnect(error) ? 'Gmail needs to be reconnected. Choose Reconnect to sign in again.' : 'Gmail sync did not finish. Try Sync now again.'); }
    finally { setGmailBusy(false); }
  };
  const startGmailConnect = async () => {
    setGmailBusy(true); setGmailMessage('');
    try { await connectGmail(); } catch { setGmailMessage('Burnrate could not start Gmail sign-in. Try again.'); setGmailBusy(false); }
  };

  // Burnrate redirects here after Google sign-in; the first sync runs right away instead of waiting for a Burnrate restart.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('gmail');
    if (!outcome) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (outcome === 'connected') void runGmailSync('Gmail connected. Checking for statement emails…');
    else setGmailMessage(params.get('reason') === 'no_refresh' ? 'Google did not grant offline access. Remove the app under Google Account → Security → Third-party access, then connect again.' : 'Gmail sign-in did not complete. Try again.');
  }, []);

  const update = (field: keyof Draft, value: string) => { setDraft(current => ({ ...current, [field]: value })); setDirty(true); setMessage(''); };
  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true); setMessage('');
    try {
      await apiMutate(endpoints.settings, 'PUT', { name: draft.name.trim(), watch_folder: draft.watch_folder.trim(), display_currency: draft.display_currency.trim().toUpperCase() });
      setDirty(false); setMessage('Settings saved in Burnrate.');
    } catch { setMessage('Burnrate could not save these settings. Try again when it reconnects.'); }
    finally { setSaving(false); }
  };

  if (settingsState.loading && !settingsState.data) return <div className="opt-panel opt-skeleton" aria-label="Loading settings"><div className="loading" /><div className="loading" /></div>;
  if (settingsState.error && !settingsState.data) return <div className="opt-empty"><Settings2 size={24} /><h2>Settings are temporarily unavailable</h2><p>CardOS will reconnect to your local Burnrate data automatically.</p></div>;

  return <div className="opt-page">
    <section className="opt-feature"><div className="opt-feature-icon"><Settings2 size={25} strokeWidth={1.7} /></div><div><div className="eyebrow">Local preferences</div><h2>Connected to Burnrate</h2><p>These preferences are stored on your Mac by Burnrate.</p></div></section>
    <div className="opt-grid section">
      <form className="opt-panel opt-form" onSubmit={save}>
        <div className="opt-panel-top"><span className="opt-icon"><FolderOpen size={18} /></span></div>
        <h3>Personal setup</h3><p className="opt-secondary">Update the name, statement folder, and display currency saved in Burnrate.</p>
        <label>Name<input value={draft.name} onChange={event => update('name', event.target.value)} autoComplete="name" /></label>
        <label>Statement watch folder<input value={draft.watch_folder} onChange={event => update('watch_folder', event.target.value)} spellCheck={false} /></label>
        <label>Display currency<input value={draft.display_currency} onChange={event => update('display_currency', event.target.value)} maxLength={3} pattern="[A-Za-z]{3}" title="Three letter currency code" /></label>
        <div className="opt-form-actions"><button type="submit" disabled={!dirty || saving}><Save size={16} />{saving ? 'Saving…' : 'Save settings'}</button><span role="status" aria-live="polite">{message}</span></div>
      </form>
      <section className="opt-panel opt-connect"><div className="opt-panel-top"><span className="opt-icon"><Mail size={18} /></span><span className={`opt-tag ${gmailConnected ? 'opt-connected' : ''}`}>{gmailConnected ? 'Connected' : gmail?.configured ? 'Not connected' : 'Not configured'}</span></div><h3>Gmail integration</h3>
        <p className="opt-secondary">{gmailConnected ? 'Gmail is connected to Burnrate with read-only access. Burnrate checks for statement emails from the last 120 days when it starts, and you can sync any time.'
          : gmail?.configured ? 'Connect the Gmail account that receives your card statements. Burnrate requests read-only access and saves statement attachments to your watch folder.'
          : <>Gmail auto-sync not configured. Run <code>npm run gmail:setup</code> in the CardOS folder to add a Google OAuth client. Statement processing and the rest of CardOS work without it.</>}</p>
        {gmail?.last_sync && <div className="opt-data"><span>Last Gmail sync</span><strong className="opt-small">{new Date(gmail.last_sync).toLocaleString('en-IN')}</strong></div>}
        {gmail?.configured && <div className="opt-form-actions">
          {gmailConnected && <button type="button" disabled={gmailBusy} onClick={() => void runGmailSync()}><RefreshCw size={16} />{gmailBusy ? 'Syncing…' : 'Sync now'}</button>}
          <button type="button" disabled={gmailBusy} onClick={() => void startGmailConnect()}><Mail size={16} />{gmailConnected ? 'Reconnect' : 'Connect Gmail'}</button>
          <span role="status" aria-live="polite">{gmailMessage}</span></div>}
        {!gmail?.configured && gmailMessage && <p className="opt-secondary" role="status">{gmailMessage}</p>}</section>
    </div>
  </div>;
}

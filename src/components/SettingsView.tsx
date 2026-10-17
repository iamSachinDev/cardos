import { useEffect, useState } from 'react';
import { FolderOpen, Mail, Save, Settings2 } from 'lucide-react';
import { apiMutate, endpoints, useLiveData } from '../lib/live';
import '../styles/optimize.css';

type BurnrateSettings = {
  setup_complete?: boolean;
  settings?: { name?: string | null; watch_folder?: string | null; display_currency?: string | null };
};
type GmailStatus = { configured?: boolean; connected?: boolean; last_sync?: string | null };
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

  useEffect(() => {
    if (settings && !dirty) setDraft({ name: settings.name || '', watch_folder: settings.watch_folder || '', display_currency: settings.display_currency || 'INR' });
  }, [settings, dirty]);

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
      <section className="opt-panel opt-connect"><div className="opt-panel-top"><span className="opt-icon"><Mail size={18} /></span><span className={`opt-tag ${gmail?.configured && gmail.connected ? 'opt-connected' : ''}`}>{gmail?.configured && gmail.connected ? 'Connected' : 'Not configured'}</span></div><h3>Gmail integration</h3><p className="opt-secondary">{gmail?.configured && gmail.connected ? 'Gmail is connected to Burnrate.' : 'Gmail auto-sync not configured. Statement processing and the rest of CardOS work without it.'}</p>{gmail?.last_sync && <div className="opt-data"><span>Last Gmail sync</span><strong className="opt-small">{new Date(gmail.last_sync).toLocaleString('en-IN')}</strong></div>}</section>
    </div>
  </div>;
}

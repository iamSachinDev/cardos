import { useEffect, useRef, useState } from 'react';
import { bankLabel, formatCurrency, formatDate } from '../lib/api';
import type { Statement } from '../lib/api';
import { apiMutate, endpoints, useLiveData } from '../lib/live';
import '../styles/statements.css';

function UnlockStatement({ statementId }: { statementId: string }) {
  const passwordInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const input = passwordInput.current;
    return () => { if (input) input.value = ''; };
  }, []);

  const unlock = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !passwordInput.current?.value) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await apiMutate(`/api/statements/${encodeURIComponent(statementId)}/reparse-with-password`, 'POST', {
        password: passwordInput.current.value,
      }, { timeoutMs: 60_000 }) as { status?: string };
      if (result?.status === 'password_needed') {
        setMessage('That password did not open the PDF. Please try again.');
      } else if (result?.status !== 'success') {
        setMessage('Burnrate could not import this statement. Please try again.');
      }
    } catch {
      setMessage('Burnrate could not unlock this statement. Please try again.');
    } finally {
      if (passwordInput.current) passwordInput.current.value = '';
      setBusy(false);
    }
  };

  return <form className="statement-unlock" onSubmit={unlock}>
    <label>PDF password<input ref={passwordInput} type="password" autoComplete="off" spellCheck={false} disabled={busy} required /></label>
    <button type="submit" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock statement'}</button>
    <small>Burnrate saves a successful PDF password encrypted on this Mac for future imports.</small>
    {message && <span role="status" aria-live="polite">{message}</span>}
  </form>;
}

function statusLabel(raw?: string) {
  const status = (raw || '').toLowerCase();
  if (['success','parsed','complete','completed'].includes(status)) return { text:'Parsed successfully', tone:'success' };
  if (['processing','pending','queued','parsing'].includes(status)) return { text:'Processing', tone:'warning' };
  if (['password_needed','password_required'].includes(status)) return { text:'Password required', tone:'warning' };
  if (['failed','parse_failed','parse_error','error'].includes(status)) return { text:'Parse failed', tone:'danger' };
  return { text:raw || 'Unknown status', tone:'' };
}
export default function StatementsView() {
  const result = useLiveData<{statements:Statement[]}>(endpoints.statements);
  const processing = useLiveData<Array<{id:string;fileName:string;status:string;message?:string}>>(endpoints.processing).data || [];
  if (!result.data) return <div className="card">{result.error ? 'Burnrate temporarily unavailable. Retrying…' : <><div className="loading"/><div className="loading" style={{marginTop:20}}/></>}</div>;
  const rows = result.data.statements || [];
  const activity = processing.filter(item => !['success','complete','completed'].includes(item.status));
  return <><section className="card"><div className="section-title-row"><div><div className="section-title">Statement vault</div><div className="muted" style={{fontSize:12,marginTop:4}}>Local files parsed by Burnrate</div></div><span className="pill">{rows.length} imported</span></div>
    {rows.length ? <div className="statement-list">{rows.map(row=>{
      const last4 = row.cardLast4 || row.card_last4 || '';
      const start = row.periodStart || row.period_start;
      const end = row.periodEnd || row.period_end;
      const due = row.paymentDueDate || row.payment_due_date;
      const count = row.transactionCount ?? row.transaction_count ?? 0;
      const amount = row.totalAmountDue ?? row.total_amount_due;
      const state = statusLabel(row.status);
      const locked = ['password_needed', 'password_required'].includes((row.status || '').toLowerCase());
      return <article className="statement-item" key={row.id}><div className="statement-mark">{locked ? '•' : (row.bank || '?').slice(0,1).toUpperCase()}</div><div className="statement-main"><strong>{locked ? 'Protected PDF statement' : <>{bankLabel(row.bank)} <span className="muted">••{last4}</span></>}</strong>{locked ? <><small>Imported {formatDate(row.importedAt || row.imported_at)}</small><small>Enter the PDF password to import this statement.</small></> : <><small>{formatDate(start)} – {formatDate(end)} · {count} transactions</small><small>Imported {formatDate(row.importedAt || row.imported_at)}</small></>}</div><div className="statement-meta">{!locked && <><strong>{formatCurrency(amount,row.currency||'INR')}</strong><small>Due {formatDate(due)}</small></>}<span className={`pill ${state.tone}`}>{state.text}</span>{locked && <UnlockStatement statementId={row.id} />}</div></article>;
    })}</div> : <div className="empty">Your spending story starts with your first statement.<br/>Drop a PDF into Burnrate’s watched folder.</div>}
  </section>
  {activity.length > 0 && <section className="card section"><div className="section-title">Import activity</div>{activity.map(item => { const state=statusLabel(item.status); return <div className="simple-row" key={item.id}><div><strong>{item.fileName}</strong><small>{item.message || 'Burnrate is processing this statement.'}</small></div><span className={`pill ${state.tone}`}>{state.text}</span></div>; })}</section>}</>;
}

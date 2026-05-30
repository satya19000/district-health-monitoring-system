import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Primitives';
import AuthShell from './AuthShell';

export default function ForgotPassword() {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(''); setBusy(true);
    const { error } = await sendReset(email.trim());
    setBusy(false);
    if (error) { setError(error); return; }
    setSent(true);
  }

  return (
    <AuthShell heading="Reset your password" sub="We'll email you a reset code to set a new password.">
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {sent ? (
        <div className="alert alert-ok">
          If an account exists for {email}, a reset email is on its way. Use the code on the
          {' '}<Link to="/reset-password" style={{ color: 'var(--teal)' }}>reset page</Link>.
        </div>
      ) : (
        <>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@health.gov.in" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy || !email} onClick={submit}>
            {busy ? <Spinner /> : 'Send Reset Email'}
          </button>
        </>
      )}
      <div className="tcenter muted" style={{ marginTop: 20, fontSize: 13.5 }}>
        <Link to="/login" style={{ color: 'var(--teal)' }}>Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

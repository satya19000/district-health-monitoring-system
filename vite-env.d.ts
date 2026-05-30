import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Primitives';
import AuthShell from './AuthShell';

/**
 * Supports both flows:
 *  - Code-based: user enters email + 6-digit code from the email.
 *  - Link-based: the backend redirects here with ?token=... (insforge_status=ready),
 *    in which case we use the token directly with resetPassword.
 */
export default function ResetPassword() {
  const { confirmReset } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const linkToken = params.get('token');
  const linkReady = params.get('insforge_status') === 'ready' && !!linkToken;

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const err = params.get('insforge_error');
    if (err) setError(decodeURIComponent(err));
  }, [params]);

  async function submit() {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      if (linkReady && linkToken) {
        const { error } = await insforge.auth.resetPassword({ newPassword: password, otp: linkToken });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await confirmReset(email.trim(), code.trim(), password);
        if (error) throw new Error(error);
      }
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell heading="Set a new password" sub="Choose a strong password you haven't used before.">
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {done ? (
        <div className="alert alert-ok">Password updated. Redirecting to sign in…</div>
      ) : (
        <>
          {!linkReady && (
            <>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@health.gov.in" />
              </div>
              <div className="field">
                <label>Reset code</label>
                <input className="input mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
              </div>
            </>
          )}
          <div className="field">
            <label>New password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy || !password || (!linkReady && (!email || !code))} onClick={submit}>
            {busy ? <Spinner /> : 'Update Password'}
          </button>
        </>
      )}
      <div className="tcenter muted" style={{ marginTop: 20, fontSize: 13.5 }}>
        <Link to="/login" style={{ color: 'var(--teal)' }}>Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

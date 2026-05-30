import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LIST } from '../../lib/roles';
import { Spinner } from '../../components/ui/Primitives';
import AuthShell from './AuthShell';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('ASHA');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(''); setNotice('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    const { error, needsVerification } = await signUp(email.trim(), password, name.trim(), role);
    setBusy(false);
    if (error) { setError(error); return; }
    if (needsVerification) {
      setNotice('Account created. Check your email to verify your address, then sign in.');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <AuthShell heading="Create your account" sub="Request access to the District Health Monitoring System.">
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {notice && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{notice}</div>}
      <div className="field">
        <label>Full name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. A. Sharma" />
      </div>
      <div className="field">
        <label>Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@health.gov.in" />
      </div>
      <div className="field">
        <label>Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      </div>
      <div className="field">
        <label>Requested role</label>
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_LIST.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <span className="muted" style={{ fontSize: 11.5 }}>
          Elevated roles may require approval by a State Admin before access is granted.
        </span>
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || !email || !password || !name} onClick={submit}>
        {busy ? <Spinner /> : 'Create Account'}
      </button>
      <div className="tcenter muted" style={{ marginTop: 20, fontSize: 13.5 }}>
        Already registered? <Link to="/login" style={{ color: 'var(--teal)' }}>Sign in</Link>
      </div>
    </AuthShell>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { defaultDashboard } from '../../lib/roles';
import { Spinner } from '../../components/ui/Primitives';
import AuthShell from './AuthShell';

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(''); setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) { setError(error); return; }
    const dest = (location.state as any)?.from || '/';
    navigate(dest, { replace: true });
  }

  return (
    <AuthShell heading="Welcome back" sub="Sign in to access your district health dashboards.">
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="field">
        <label>Email</label>
        <input className="input" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="officer@health.gov.in"
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div className="field">
        <label>Password</label>
        <input className="input" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div className="row between" style={{ marginBottom: 18 }}>
        <Link to="/forgot-password" className="muted" style={{ fontSize: 13 }}>Forgot password?</Link>
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || !email || !password} onClick={submit}>
        {busy ? <Spinner /> : 'Sign In'}
      </button>
      <div className="tcenter muted" style={{ marginTop: 20, fontSize: 13.5 }}>
        New here? <Link to="/register" style={{ color: 'var(--teal)' }}>Create an account</Link>
      </div>
    </AuthShell>
  );
}

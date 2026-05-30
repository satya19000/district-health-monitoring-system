import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Brand } from '../components/ui/Primitives';

export default function Unauthorized() {
  return (
    <div className="center-screen">
      <div className="panel panel-pad" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}><Brand /></div>
        <ShieldAlert size={40} style={{ color: 'var(--amber)', marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 8px', fontFamily: 'Fraunces, serif' }}>Access restricted</h2>
        <p className="muted" style={{ margin: '0 0 22px', lineHeight: 1.6 }}>
          Your role does not have permission to view this section. If you believe this is a
          mistake, contact your State or District Administrator.
        </p>
        <Link to="/" className="btn btn-primary">Back to my dashboard</Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Brand } from '../components/ui/Primitives';

export default function NotFound() {
  return (
    <div className="center-screen">
      <div className="panel panel-pad" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}><Brand /></div>
        <Compass size={40} style={{ color: 'var(--teal)', marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 8px', fontFamily: 'Fraunces, serif' }}>Page not found</h2>
        <p className="muted" style={{ margin: '0 0 22px', lineHeight: 1.6 }}>
          The page you are looking for doesn’t exist or may have moved.
        </p>
        <Link to="/" className="btn btn-primary">Return home</Link>
      </div>
    </div>
  );
}

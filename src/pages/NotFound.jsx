import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

function NotFound() {
  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
      <FiAlertTriangle size={48} color="var(--warning)" />
      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '16px 0 8px', color: 'var(--text-primary)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px' }}>
        La página que buscas no existe.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: 'var(--radius-md)',
          background: 'var(--primary)', color: '#fff', fontWeight: 600,
          textDecoration: 'none', fontSize: '0.95rem',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export default NotFound;

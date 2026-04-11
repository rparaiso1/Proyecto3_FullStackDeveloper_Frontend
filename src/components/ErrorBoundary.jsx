import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '2rem',
          color: 'var(--text-primary, #333)', textAlign: 'center',
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-muted, #666)', marginBottom: '1.5rem' }}>
            Ha ocurrido un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: 'var(--primary, #3B82F6)', color: 'white',
              cursor: 'pointer', fontSize: '1rem',
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

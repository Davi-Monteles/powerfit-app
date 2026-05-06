import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Clear all local storage to reset state
    localStorage.clear();
    sessionStorage.clear();
    // Unregister service workers as well
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(reg) { reg.unregister(); });
      });
    }
    // Reload page
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#0B0E14', color: '#fff', padding: '24px', textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 69, 0, 0.1)', border: '1px solid #FF4500', 
            padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '100%'
          }}>
            <h1 style={{ color: '#FF4500', margin: '0 0 16px 0', fontSize: '1.5rem' }}>Oops! Algo deu errado.</h1>
            <p style={{ color: '#A0AEC0', marginBottom: '24px', lineHeight: '1.5' }}>
              Detectamos um problema ao carregar as informações. Isso geralmente ocorre devido a uma versão desatualizada salva no seu dispositivo.
            </p>
            
            <button 
              onClick={this.handleReset}
              style={{
                background: '#FF4500', color: '#fff', border: 'none', padding: '14px 24px',
                borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                width: '100%', marginBottom: '16px'
              }}
            >
              🔄 Limpar Cache e Recarregar
            </button>
            
            <details style={{ textAlign: 'left', marginTop: '16px', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px' }}>
              <summary style={{ color: '#A0AEC0', cursor: 'pointer', fontSize: '0.85rem' }}>Detalhes Técnicos (Para Suporte)</summary>
              <pre style={{ color: '#FF6B35', fontSize: '0.75rem', overflow: 'auto', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

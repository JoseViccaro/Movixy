import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          backgroundColor: '#141414',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '2rem' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#a3a3a3', marginBottom: '30px', maxWidth: '500px' }}>
            {this.state.error?.message || 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.'}
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 30px',
                backgroundColor: '#e50914',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 30px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
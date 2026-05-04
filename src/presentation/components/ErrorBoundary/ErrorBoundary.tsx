import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Premium full-screen error handler for TV.
 * Designed to feel like a native OS crash recovery screen.
 */
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
        <div className={styles.overlay} role="alert">
          <div className={styles.container}>
            <div className={styles.iconWrapper}>
              <AlertCircle size={64} className={styles.icon} />
            </div>
            
            <h1 className={styles.title}>Vaya, algo no ha ido bien</h1>
            <p className={styles.message}>
              {this.state.error?.message || 'Ha ocurrido un error inesperado al intentar cargar este contenido.'}
            </p>
            
            <div className={styles.actions}>
              <button
                onClick={this.handleRetry}
                className={styles.primaryBtn}
                data-focusable="true"
                autoFocus
              >
                <RefreshCw size={20} />
                <span>Reintentar ahora</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className={styles.secondaryBtn}
                data-focusable="true"
              >
                <Home size={20} />
                <span>Volver al Inicio</span>
              </button>
            </div>

            <p className={styles.footer}>
              Si el problema persiste, comprueba tu conexión local o el servidor Jellyfin.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
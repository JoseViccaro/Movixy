import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import styles from './OfflineIndicator.module.css';

/**
 * OfflineIndicator — Premium native-like warning for TV.
 * Appears when network connection is lost.
 */
export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsReconnecting(true);
      setTimeout(() => {
        setIsOffline(false);
        setIsReconnecting(false);
      }, 1500);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !isReconnecting) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`${styles.container} ${isReconnecting ? styles.reconnecting : styles.offline}`}
    >
      <div className={styles.content}>
        {isReconnecting ? (
          <>
            <RefreshCw size={20} className={styles.spin} />
            <span>Restableciendo conexión...</span>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <span>Sin conexión a internet</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
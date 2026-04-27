import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#e50914',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <WifiOff size={20} aria-hidden="true" />
      <span>Sin conexión a internet</span>
    </div>
  );
};

export default OfflineIndicator;
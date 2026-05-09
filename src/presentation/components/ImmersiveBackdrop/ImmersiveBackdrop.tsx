import { useState, useEffect } from 'react';
import { useBackdrop } from './BackdropContext';
import styles from './ImmersiveBackdrop.module.css';

export const ImmersiveBackdrop = () => {
  const { url } = useBackdrop();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (url === currentUrl) return;

    const timer = setTimeout(() => {
      setIsChanging(true);
      setPrevUrl(currentUrl);
      
      const switchTimer = setTimeout(() => {
        setCurrentUrl(url);
        setIsChanging(false);
      }, 50);
      
      return () => clearTimeout(switchTimer);
    }, 0);

    return () => clearTimeout(timer);
  }, [url, currentUrl]);

  return (
    <div className={styles.container}>
      {/* Imagen anterior (para cross-fade) */}
      {prevUrl && (
        <img 
          src={prevUrl} 
          className={`${styles.backdrop} ${!isChanging ? '' : styles.visible}`} 
          alt="" 
          aria-hidden="true"
        />
      )}
      
      {/* Imagen actual */}
      {currentUrl && (
        <img 
          src={currentUrl} 
          className={`${styles.backdrop} ${!isChanging ? styles.visible : ''}`} 
          alt="" 
          aria-hidden="true"
        />
      )}
      
      <div className={styles.overlay} />
      <div className={styles.bottomFade} />
    </div>
  );
};

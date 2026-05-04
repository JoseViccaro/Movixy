import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onFinish?: () => void;
  /** Duration in milliseconds before auto-dismiss */
  duration?: number;
}

export const SplashScreen = ({ onFinish = () => {}, duration = 2800 }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'expand' | 'fade'>('logo');

  useEffect(() => {
    const expandTimer = setTimeout(() => setPhase('expand'), duration * 0.5);
    const fadeTimer = setTimeout(() => setPhase('fade'), duration * 0.8);
    const finishTimer = setTimeout(() => onFinish(), duration);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, duration]);

  return (
    <div className={`${styles.splash} ${styles[phase]}`} aria-label="Cargando Movixy">
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gradientOrb3} />
      </div>

      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <div className={styles.logoGlow} />
          <svg className={styles.logoIcon} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M20 16L32 22L20 28V16Z" fill="currentColor" />
            <line x1="16" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="36" x2="24" y2="40" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <h1 className={styles.logoText}>MOVIXY</h1>
        </div>

        <p className={styles.tagline}>Your Private Cinema</p>

        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      </div>
    </div>
  );
};

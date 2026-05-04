import { useEffect, useState } from 'react';
import { Logo } from '@/presentation/components/Logo/Logo';
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
          <Logo size="large" />
        </div>

        <p className={styles.tagline}>Your Private Cinema</p>

        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      </div>
    </div>
  );
};

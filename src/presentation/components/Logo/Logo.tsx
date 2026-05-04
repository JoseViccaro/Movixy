import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo = ({ className = '', size = 'medium', showText = true }: LogoProps) => {
  return (
    <div className={`${styles.logoContainer} ${styles[size]} ${className}`}>
      <div className={styles.logoWrapper}>
        <svg 
          className={styles.logoIcon} 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4" y="8" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M20 16L32 22L20 28V16Z" fill="currentColor" />
          <line x1="16" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="36" x2="24" y2="40" stroke="currentColor" strokeWidth="2.5" />
        </svg>
        <div className={styles.logoGlow} />
      </div>
      {showText && <h1 className={styles.logoText}>MOVIXY</h1>}
    </div>
  );
};

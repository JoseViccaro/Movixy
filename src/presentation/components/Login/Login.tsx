import { useState } from 'react';
import { Eye, EyeOff, MonitorPlay } from 'lucide-react';
import styles from './Login.module.css';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';

interface LoginProps {
  onLogin: (serverUrl: string, username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const Login = ({ onLogin, isLoading, error }: LoginProps) => {
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('movixy_server_url') || 'http://localhost:8096';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('movixy_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // D-pad navigation for the login form
  useDpadNavigation({
    enabled: true,
    containerSelector: `.${styles.formWrapper}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('movixy_username', username);
    onLogin(serverUrl, username, password);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backdrop}></div>
      <div className={styles.formWrapper}>
        <div className={styles.logoSection}>
          <MonitorPlay size={48} className={styles.logoIcon} />
          <h1 className={styles.logoText}>MOVIXY</h1>
          <p className={styles.tagline}>Your Private Streaming Platform</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="server-url">Server URL</label>
            <input
              id="server-url"
              type="text"
              placeholder="http://192.168.x.x:8096"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className={styles.input}
              data-focusable="true"
            />
            <p className={styles.inputHint}>Usa tu IP local si estás en la tele (ej: 192.168.1.50)</p>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Your Jellyfin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              autoComplete="username"
              data-focusable="true"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
                data-focusable="true"
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-focusable="true"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !username}
            data-focusable="true"
          >
            {isLoading ? (
              <span className={styles.spinner}></span>
            ) : (
              'Sign In'
            )}
          </button>

          <p className={styles.helpText}>
            Connect to your Jellyfin server to start streaming
          </p>
        </form>
      </div>
    </div>
  );
};

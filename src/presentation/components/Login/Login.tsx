import { useState } from "react";
import { Eye, EyeOff, MonitorPlay, Radio } from "lucide-react";
import styles from "./Login.module.css";
import { useDpadNavigation } from "@/presentation/hooks/useDpadNavigation";
import { useServerDiscovery } from "@/application/hooks/useServerDiscovery";
import { ServerPickerSheet } from "@/presentation/components/ServerPicker/ServerPickerSheet";

interface LoginProps {
  onLogin: (serverUrl: string, username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const Login = ({ onLogin, isLoading, error }: LoginProps) => {
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem("movixy_server_url") || "/jellyfin";
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("movixy_username") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isServerSheetOpen, setIsServerSheetOpen] = useState(false);

  const { servers, isScanning, scan } = useServerDiscovery({ autoScan: true });

  // D-pad navigation for the login form
  useDpadNavigation({
    enabled: true,
    containerSelector: `.${styles.formWrapper}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .trim();
    const cleanServerUrl = serverUrl
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .trim();
    localStorage.setItem("movixy_username", cleanUsername);
    localStorage.setItem("movixy_server_url", cleanServerUrl);
    onLogin(cleanServerUrl, cleanUsername, password);
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="server-url">Server URL</label>
              <button
                type="button"
                onClick={() => setIsServerSheetOpen(true)}
                style={{
                  background: servers.length > 0 ? "rgba(229, 9, 20, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  border: servers.length > 0 ? "1px solid rgba(229, 9, 20, 0.5)" : "1px solid rgba(255, 255, 255, 0.15)",
                  color: servers.length > 0 ? "#ff4d58" : "#ccc",
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
                data-focusable="true"
              >
                <Radio size={13} className={isScanning ? styles.scanningPulse : ""} />
                {isScanning
                  ? "Buscando..."
                  : servers.length > 0
                  ? `${servers.length} Servidor${servers.length > 1 ? "es" : ""}`
                  : "Buscar Servidor"}
              </button>
            </div>
            <input
              id="server-url"
              type="text"
              placeholder="http://localhost:8096"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className={styles.input}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              data-focusable="true"
            />
            <p className={styles.inputHint}>Ingresa http://localhost:8096 o selecciona un servidor detectado</p>
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              data-focusable="true"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                data-focusable="true"
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              "Sign In"
            )}
          </button>

          <p className={styles.helpText}>
            Connect to your Jellyfin server to start streaming
          </p>
        </form>
      </div>

      <ServerPickerSheet
        isOpen={isServerSheetOpen}
        onClose={() => setIsServerSheetOpen(false)}
        servers={servers}
        isScanning={isScanning}
        onScan={scan}
        selectedServerUrl={serverUrl}
        onSelectServer={(srv) => {
          setServerUrl(srv.url);
        }}
      />
    </div>
  );
};

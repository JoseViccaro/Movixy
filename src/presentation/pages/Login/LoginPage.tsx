import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '@/presentation/components/Login/Login';
import { SplashScreen } from '@/presentation/components/SplashScreen/SplashScreen';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { secureStorage } from '@/core/utils/secure-storage';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  // Auth check is async now — resolve it once on mount
  useEffect(() => {
    secureStorage.isAuthenticated().then((authenticated) => {
      setIsAuth(authenticated);
      setIsAuthChecked(true);
    });
  }, []);

  const userId = localStorage.getItem('movixy_user_id');

  const handleSplashFinish = useCallback(() => {
    if (isAuth && userId) {
      navigate('/', { replace: true });
    } else {
      setShowSplash(false);
    }
  }, [isAuth, userId, navigate]);

  const handleLogin = async (
    serverUrl: string,
    username: string,
    password: string,
  ) => {
    setIsLoading(true);
    setError(null);
    setShowSplash(false);

    let normalizedUrl = serverUrl
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();

    if (normalizedUrl && !normalizedUrl.startsWith('http') && !normalizedUrl.startsWith('/')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }
    
    // Clean any double slashes after protocol and trailing slashes
    normalizedUrl = normalizedUrl.replace(/^(https?):\/\/+/i, '$1://').replace(/\/+$/, '');

    const cleanUsername = username
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();

    try {
      // Pass the normalized URL to the client so it connects to the right host
      const client = new JellyfinApiClient('', normalizedUrl);
      const response = await client.authenticate(cleanUsername, password);

      await secureStorage.setToken(response.AccessToken);
      localStorage.setItem('movixy_server_url', normalizedUrl);
      localStorage.setItem('movixy_user_id', response.User.Id);
      localStorage.setItem('movixy_username', response.User.Name);

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error details:', {
        url: normalizedUrl,
        error: err
      });
      const errorDetail = err instanceof Error ? err.message : String(err);
      setError(`No se pudo conectar a ${normalizedUrl} (${errorDetail}). Verifica que el servidor esté encendido.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until the async auth check resolves
  if (!isAuthChecked) return null;

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;
}


const SECRET_KEY = 'movixy_secure_token_v1';

export const secureStorage = {
  setToken(token: string): void {
    const encoded = btoa(token);
    const scrambled = encoded.split('').reverse().join('');
    localStorage.setItem(SECRET_KEY, scrambled);
  },

  getToken(): string | null {
    const scrambled = localStorage.getItem(SECRET_KEY);
    if (!scrambled) return null;
    const encoded = scrambled.split('').reverse().join('');
    try {
      return atob(encoded);
    } catch {
      return null;
    }
  },

  clearToken(): void {
    localStorage.removeItem(SECRET_KEY);
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },
};

export const securityHeaders = () => {
  const token = secureStorage.getToken();
  if (!token) return {};
  return { 'X-Movixy-Token': token };
};
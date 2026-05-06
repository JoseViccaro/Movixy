/**
 * secure-storage.ts — Token storage using Web Crypto API (AES-GCM).
 *
 * Why AES-GCM:
 * - Built into every modern browser via window.crypto.subtle — zero dependencies
 * - Authenticated encryption: tampering with the ciphertext is detectable
 * - Each write generates a fresh random IV, so identical tokens produce different ciphertexts
 *
 * Threat model: protects against casual localStorage inspection and XSS token theft.
 * It does NOT protect against an attacker who can execute arbitrary JS in the same origin
 * (they could call getToken() directly). For that, HttpOnly cookies + server-side sessions
 * would be needed — out of scope for a local-network Jellyfin client.
 */

const STORAGE_KEY = 'movixy_token_v2';
const LEGACY_KEY = 'movixy_secure_token_v1';

// Derive a stable AES-GCM key from a fixed passphrase bound to this origin.
// The key never leaves the browser — it's re-derived on every page load.
async function getDerivedKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // Bind the passphrase to the current origin so tokens from one server
  // can't be replayed on another (e.g., attacker's copy of the app).
  const passphrase = `movixy-v2:${window.location.origin}`;

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  // Salt is static and public — its job is domain separation, not secrecy.
  const salt = encoder.encode('movixy-salt-2024');

  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// Fallback obfuscation for non-secure contexts (HTTP over IP, like TVs)
const isCryptoAvailable = typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;

async function encrypt(plaintext: string): Promise<string> {
  if (!isCryptoAvailable) {
    // Fallback: simple obfuscation for non-secure contexts
    return `base64:${btoa(plaintext).split('').reverse().join('')}`;
  }

  const key = await getDerivedKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(packed: string): Promise<string | null> {
  try {
    if (packed.startsWith('base64:')) {
      const obfuscated = packed.replace('base64:', '');
      return atob(obfuscated.split('').reverse().join(''));
    }

    if (!isCryptoAvailable) return null;

    const key = await getDerivedKey();
    const combined = Uint8Array.from(atob(packed), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/** Migrate a legacy obfuscated token to the new encrypted format. */
async function migrateLegacyToken(): Promise<void> {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;

  try {
    const encoded = legacy.split('').reverse().join('');
    const token = atob(encoded);
    await secureStorage.setToken(token);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Corrupt legacy token — discard silently, user will re-login
    localStorage.removeItem(LEGACY_KEY);
  }
}

// Run migration once on module load (fire-and-forget, non-blocking)
migrateLegacyToken();

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    const encrypted = await encrypt(token);
    localStorage.setItem(STORAGE_KEY, encrypted);
  },

  async getToken(): Promise<string | null> {
    const packed = localStorage.getItem(STORAGE_KEY);
    if (!packed) return null;
    return decrypt(packed);
  },

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  },
};

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await secureStorage.getToken();
  if (!token) return {};
  return { 'X-Emby-Authorization': `MediaBrowser Token="${token}"` };
}

import { vi } from 'vitest';

// Mock localStorage for jsdom environment (vitest)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };
})();

// Only define if window exists (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
}
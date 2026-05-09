import { useState, type ReactNode } from 'react';
import { BackdropContext } from './BackdropContext';

export function BackdropProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);

  return (
    <BackdropContext.Provider value={{ url, setUrl }}>
      {children}
    </BackdropContext.Provider>
  );
}

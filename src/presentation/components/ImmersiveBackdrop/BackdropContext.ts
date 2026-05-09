import { createContext, useContext } from 'react';

export interface BackdropContextType {
  url: string | null;
  setUrl: (url: string | null) => void;
}

export const BackdropContext = createContext<BackdropContextType | undefined>(undefined);

export function useBackdrop() {
  const context = useContext(BackdropContext);
  if (!context) {
    throw new Error('useBackdrop must be used within a BackdropProvider');
  }
  return context;
}

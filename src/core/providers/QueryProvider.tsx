import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

/**
 * QueryProvider — Infraestructura de caché global
 *
 * staleTime: 5 minutos — los datos de Jellyfin no cambian cada segundo.
 * gcTime: 30 minutos — mantiene en memoria entre navegaciones para UX instantánea.
 * retry: 2 — reintenta en fallos de red transitorios.
 * refetchOnWindowFocus: false — no re-fetch al volver a la ventana (costoso con streaming).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

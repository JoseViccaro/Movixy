import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import { queryKeys } from '@/core/query-keys';
import type { Media } from '@/domain/models/media.model';

// Async factory — same pattern as useMedia.ts
const createRepository = async (userId: string) => {
  const client = await JellyfinApiClient.create();
  return new JellyfinMediaRepository(client, userId);
};

// ─── Continuar Viendo ────────────────────────────────────────────────────────

export const useContinueWatching = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.user.continueWatching(),
    queryFn: async () => (await createRepository(userId!)).getContinueWatching(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

export const useFavorites = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.user.favorites(),
    queryFn: async () => (await createRepository(userId!)).getFavorites(),
    enabled: !!userId,
  });

/**
 * useFavoriteToggle — Mutación optimista para marcar/desmarcar favoritos.
 *
 * Patrón Optimistic Update:
 * 1. Actualiza el caché localmente de forma instantánea (UX sin lag).
 * 2. Envía la mutación al servidor.
 * 3. Si falla, hace rollback al estado anterior.
 * 4. Siempre invalida y refresca desde el servidor al terminar.
 */
export const useFavoriteToggle = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, isFavorite }: { mediaId: string; isFavorite: boolean }) => {
      const repo = await createRepository(userId!);
      return repo.toggleFavorite(mediaId, isFavorite);
    },
    onMutate: async ({ mediaId, isFavorite }) => {
      // Cancelar queries en vuelo para evitar race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.user.favorites() });

      // Snapshot del estado anterior para el rollback
      const previousFavorites = queryClient.getQueryData<Media[]>(queryKeys.user.favorites());

      // Update optimista: actualiza el caché antes de que responda el servidor
      queryClient.setQueryData<Media[]>(queryKeys.user.favorites(), (old = []) => {
        if (isFavorite) {
          // Si marcamos como favorito pero no está, lo añadimos (se refresheará después)
          return old;
        }
        // Si desmarcamos, lo sacamos de la lista
        return old.filter((m) => m.id !== mediaId);
      });

      return { previousFavorites };
    },
    onError: (_err, _variables, context) => {
      // Rollback si la mutación falla
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.user.favorites(), context.previousFavorites);
      }
    },
    onSettled: () => {
      // Siempre refrescamos desde el servidor al terminar (éxito o error)
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites() });
      // También invalidamos todas las listas de media para actualizar el estado isFavorite
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
};

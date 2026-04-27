import { useQuery } from '@tanstack/react-query';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import { queryKeys } from '@/core/query-keys';
import type { FilterOptions } from '@/domain/repositories/media.repository';

/**
 * Hook de fábrica: crea el repositorio sin acoplar los hooks a la implementación concreta.
 * Si mañana queremos un MockRepository para tests, solo cambiamos esta función.
 */
const createRepository = (userId: string) => {
  const client = new JellyfinApiClient();
  return new JellyfinMediaRepository(client, userId);
};

// ─── Hooks de Media ──────────────────────────────────────────────────────────

export const usePopular = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.popular(),
    queryFn: () => createRepository(userId!).getPopular(),
    enabled: !!userId,
  });

export const useMovies = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.movies(),
    queryFn: () => createRepository(userId!).getMovies(),
    enabled: !!userId,
  });

export const useSeries = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.series(),
    queryFn: () => createRepository(userId!).getSeries(),
    enabled: !!userId,
  });

export const useMediaById = (userId: string | null, itemId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.byId(itemId!),
    queryFn: () => createRepository(userId!).getById(itemId!),
    enabled: !!userId && !!itemId,
  });

export const useEpisodes = (userId: string | null, seriesId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.episodes(seriesId!),
    queryFn: () => createRepository(userId!).getEpisodes(seriesId!),
    enabled: !!userId && !!seriesId,
  });

export const useSearch = (userId: string | null, query: string) =>
  useQuery({
    queryKey: queryKeys.media.search(query),
    queryFn: () => createRepository(userId!).search(query),
    enabled: !!userId && query.trim().length > 2,
    // No queremos golpear la API en cada keystroke: el debounce va en el componente
    staleTime: 1000 * 60 * 2,
  });

export const useFiltered = (userId: string | null, filters: FilterOptions | null) => {
  const hasFilters = !!filters && (
    (filters.genres?.length ?? 0) > 0 ||
    (filters.years?.length ?? 0) > 0 ||
    (filters.ratings?.length ?? 0) > 0 ||
    (filters.languages?.length ?? 0) > 0 ||
    filters.mediaType !== 'all'
  );

  return useQuery({
    queryKey: queryKeys.media.filtered(filters as Record<string, unknown>),
    queryFn: () => createRepository(userId!).getFiltered(filters!),
    enabled: !!userId && hasFilters,
  });
};

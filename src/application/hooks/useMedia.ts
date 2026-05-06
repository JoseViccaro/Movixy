import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import { queryKeys } from '@/core/query-keys';
import type { FilterOptions } from '@/domain/repositories/media.repository';

const PAGE_SIZE = 40;

/**
 * Repository factory — async because JellyfinApiClient.create() decrypts
 * the stored token before returning. This keeps the token out of sync code.
 */
const createRepository = async (userId: string) => {
  const client = await JellyfinApiClient.create();
  return new JellyfinMediaRepository(client, userId);
};

// ─── Paginated (infinite scroll) hooks ───────────────────────────────────────

/**
 * usePopularInfinite — loads popular content page by page.
 * Call fetchNextPage() when the user scrolls to the bottom of the list.
 *
 * Usage:
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePopularInfinite(userId);
 *   const items = data?.pages.flatMap(p => p.items) ?? [];
 */
export const usePopularInfinite = (userId: string | null) =>
  useInfiniteQuery({
    queryKey: queryKeys.media.popularInfinite(),
    queryFn: async ({ pageParam = 0 }) => {
      const repo = await createRepository(userId!);
      return repo.getPopular(PAGE_SIZE, pageParam as number);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextStartIndex ?? undefined,
    enabled: !!userId,
  });

export const useMoviesInfinite = (userId: string | null) =>
  useInfiniteQuery({
    queryKey: queryKeys.media.moviesInfinite(),
    queryFn: async ({ pageParam = 0 }) => {
      const repo = await createRepository(userId!);
      return repo.getMovies(PAGE_SIZE, pageParam as number);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextStartIndex ?? undefined,
    enabled: !!userId,
  });

export const useSeriesInfinite = (userId: string | null) =>
  useInfiniteQuery({
    queryKey: queryKeys.media.seriesInfinite(),
    queryFn: async ({ pageParam = 0 }) => {
      const repo = await createRepository(userId!);
      return repo.getSeries(PAGE_SIZE, pageParam as number);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextStartIndex ?? undefined,
    enabled: !!userId,
  });

// ─── Single-page hooks (kept for backwards compat with existing components) ──

export const usePopular = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.popular(),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return (await repo.getPopular(PAGE_SIZE)).items;
    },
    enabled: !!userId,
  });

export const useMovies = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.movies(),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return (await repo.getMovies(PAGE_SIZE)).items;
    },
    enabled: !!userId,
  });

export const useSeries = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.series(),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return (await repo.getSeries(PAGE_SIZE)).items;
    },
    enabled: !!userId,
  });

export const useMediaById = (userId: string | null, itemId: string | null) =>
  useQuery({
    queryKey: queryKeys.media.byId(itemId!),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return repo.getById(itemId!);
    },
    enabled: !!userId && !!itemId,
  });

export const useEpisodes = (userId: string | null, seriesId: string, seasonId?: string) => {
  return useQuery({
    queryKey: queryKeys.media.episodes(seriesId, seasonId),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return repo.getEpisodes(seriesId, seasonId);
    },
    enabled: !!userId && !!seriesId,
  });
};

export const useSeasons = (userId: string | null, seriesId: string) => {
  return useQuery({
    queryKey: queryKeys.media.seasons(seriesId),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return repo.getSeasons(seriesId);
    },
    enabled: !!userId && !!seriesId,
  });
};

export const useSearch = (userId: string | null, query: string) =>
  useQuery({
    queryKey: queryKeys.media.search(query),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return repo.search(query);
    },
    enabled: !!userId && query.trim().length > 2,
    staleTime: 1000 * 60 * 2,
  });

export const useFiltered = (
  userId: string | null,
  filters: FilterOptions | null,
) => {
  const hasFilters =
    !!filters &&
    ((filters.genres?.length ?? 0) > 0 ||
      (filters.years?.length ?? 0) > 0 ||
      (filters.ratings?.length ?? 0) > 0 ||
      (filters.languages?.length ?? 0) > 0 ||
      filters.mediaType !== 'all');

  return useQuery({
    queryKey: queryKeys.media.filtered(filters as Record<string, unknown>),
    queryFn: async () => {
      const repo = await createRepository(userId!);
      return repo.getFiltered(filters!);
    },
    enabled: !!userId && hasFilters,
  });
};

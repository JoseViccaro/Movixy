/**
 * queryKeys — Claves únicas y estables para el caché de TanStack Query.
 *
 * Usar un objeto centralizado garantiza que:
 * 1. No haya typos en los strings de las queries.
 * 2. Las invalidaciones sean quirúrgicas (invalidar solo lo necesario).
 * 3. Escala limpio a medida que agregamos más features.
 */
export const queryKeys = {
  media: {
    all: ['media'] as const,
    popular: () => [...queryKeys.media.all, 'popular'] as const,
    movies: () => [...queryKeys.media.all, 'movies'] as const,
    series: () => [...queryKeys.media.all, 'series'] as const,
    byId: (id: string) => [...queryKeys.media.all, 'detail', id] as const,
    episodes: (seriesId: string) => [...queryKeys.media.all, 'episodes', seriesId] as const,
    filtered: (filters: Record<string, unknown>) =>
      [...queryKeys.media.all, 'filtered', filters] as const,
    search: (query: string) => [...queryKeys.media.all, 'search', query] as const,
  },
  user: {
    all: ['user'] as const,
    continueWatching: () => [...queryKeys.user.all, 'continueWatching'] as const,
    favorites: () => [...queryKeys.user.all, 'favorites'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
  },
} as const;

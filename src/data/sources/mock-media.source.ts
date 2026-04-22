import type { Media } from '@/domain/models/media.model';

export const mockMovies: Media[] = [
  {
    id: '1',
    title: 'Inception',
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterPath: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    releaseDate: '2010-07-15',
    voteAverage: 8.8,
    mediaType: 'movie'
  },
  {
    id: '2',
    title: 'Interstellar',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QlsUUHXjNpeVDcrjz1lZ1P.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xJHokMbljvjX5Kpe52IpefJcZ7.jpg',
    releaseDate: '2014-11-05',
    voteAverage: 8.6,
    mediaType: 'movie'
  },
  {
    id: '3',
    title: 'The Dark Knight',
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    releaseDate: '2008-07-14',
    voteAverage: 9.0,
    mediaType: 'movie'
  },
  {
    id: '4',
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBRoPeO1Pd.jpg',
    releaseDate: '2023-07-19',
    voteAverage: 8.1,
    mediaType: 'movie'
  },
  {
    id: '5',
    title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjcNsV.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    releaseDate: '2024-02-27',
    voteAverage: 8.3,
    mediaType: 'movie'
  },
  {
    id: '6',
    title: 'Spider-Man: Across the Spider-Verse',
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    releaseDate: '2023-05-31',
    voteAverage: 8.4,
    mediaType: 'movie'
  }
];

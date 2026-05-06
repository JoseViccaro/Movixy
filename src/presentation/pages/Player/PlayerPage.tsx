import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '@/presentation/components/VideoPlayer/VideoPlayer';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';
import styles from './PlayerPage.module.css';

/**
 * PlayerPage — Robust dedicated playback page.
 * Handles single movies and series with auto-play functionality.
 */
export default function PlayerPage() {
  const { mediaId } = useParams<{ mediaId: string }>();
  const navigate = useNavigate();
  
  // States
  const [playableMedia, setPlayableMedia] = useState<Media | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextEpisode, setNextEpisode] = useState<Media | null>(null);

  // Refs for logic
  const repositoryRef = useRef<JellyfinMediaRepository | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    navigate(-1);
  }, [navigate]);

  const playEpisode = useCallback(async (episode: Media) => {
    setIsLoading(true);
    setShowNextEpisodePrompt(false);
    setNextEpisode(null);
    
    try {
      const client = await JellyfinApiClient.create();
      setPlayableMedia(episode);
      setStreamUrl(client.getStreamUrl(episode.id));
    } catch (err) {
      console.error('Error switching to next episode:', err);
      setError('No se pudo cargar el siguiente episodio.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (!playableMedia || episodes.length === 0) return;

    // Find current episode index
    const currentIndex = episodes.findIndex(e => e.id === playableMedia.id);
    
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      const next = episodes[currentIndex + 1];
      setNextEpisode(next);
      setShowNextEpisodePrompt(true);

      // Automatic play after 10 seconds
      autoPlayTimerRef.current = setTimeout(() => {
        playEpisode(next);
      }, 10000);
    } else {
      // End of series or single movie
      handleClose();
    }
  }, [playableMedia, episodes, handleClose, playEpisode]);

  useEffect(() => {
    if (!mediaId) {
      navigate('/', { replace: true });
      return;
    }

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const client = await JellyfinApiClient.create();
        const userId = localStorage.getItem('movixy_user_id');

        if (!userId) {
          navigate('/login', { replace: true });
          return;
        }

        const repository = new JellyfinMediaRepository(client, userId);
        repositoryRef.current = repository;

        const mediaData = await repository.getById(mediaId);

        if (mediaData.mediaType === 'tv') {
          const episodesList = await repository.getEpisodes(mediaId);
          setEpisodes(episodesList);

          if (episodesList.length > 0) {
            setPlayableMedia(episodesList[0]);
            setStreamUrl(client.getStreamUrl(episodesList[0].id));
          } else {
            throw new Error('Esta serie no tiene episodios disponibles.');
          }
        } else if (mediaData.mediaType === 'episode') {
          setPlayableMedia(mediaData);
          setStreamUrl(client.getStreamUrl(mediaId));
        } else {
          setPlayableMedia(mediaData);
          setStreamUrl(client.getStreamUrl(mediaId));
        }
      } catch (err) {
        console.error('Error loading media:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el contenido');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [mediaId, navigate]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Preparando reproducción...</p>
      </div>
    );
  }

  if (error || !playableMedia || !streamUrl) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error || 'No se pudo cargar el contenido'}</p>
        <button className={styles.backButton} onClick={handleClose} data-focusable="true">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playerWrapper}>
      <VideoPlayer
        key={playableMedia.id} // Re-mount player for new stream
        title={playableMedia.title}
        streamUrl={streamUrl}
        onClose={handleClose}
        onEnded={handleEnded}
      />

      {showNextEpisodePrompt && nextEpisode && (
        <div className={styles.nextEpisodeOverlay}>
          <div className={styles.nextEpisodeCard}>
            <p className={styles.nextLabel}>Siguiente episodio en 10s...</p>
            <h3 className={styles.nextTitle}>{nextEpisode.title}</h3>
            <div className={styles.nextActions}>
              <button 
                className={styles.playNowBtn} 
                onClick={() => playEpisode(nextEpisode)}
                data-focusable="true"
              >
                Reproducir ahora
              </button>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowNextEpisodePrompt(false)}
                data-focusable="true"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { VideoPlayer } from '@/presentation/components/VideoPlayer/VideoPlayer';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';
import { PlaybackResumeService } from '@/application/services/playback-resume.service';
import { ResumeChoiceDialog } from '@/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import styles from './PlayerPage.module.css';

/**
 * PlayerPage — Robust dedicated playback page.
 * Handles single movies and series with auto-play functionality and resume prompt.
 */
export default function PlayerPage() {
  const { mediaId } = useParams<{ mediaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const resumeService = useMemo(() => new PlaybackResumeService(), []);

  // States
  const [playableMedia, setPlayableMedia] = useState<Media | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextEpisode, setNextEpisode] = useState<Media | null>(null);

  // Resume prompt state
  const [isResumePromptOpen, setIsResumePromptOpen] = useState(false);
  const [resumeEligibility, setResumeEligibility] = useState<ReturnType<PlaybackResumeService['evaluateEligibility']> | null>(null);
  const [startPosition, setStartPosition] = useState<number | null>(null);

  // Refs for logic
  const repositoryRef = useRef<JellyfinMediaRepository | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock orientation to landscape while playing
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch (err) {
        console.warn('ScreenOrientation lock failed:', err);
      }
    };
    lockOrientation();

    return () => {
      ScreenOrientation.unlock().catch(() => {});
    };
  }, []);

  const handleClose = useCallback(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    navigate(-1);
  }, [navigate]);

  const playEpisode = useCallback(async (episode: Media) => {
    setIsLoading(true);
    setShowNextEpisodePrompt(false);
    setNextEpisode(null);
    setIsResumePromptOpen(false);
    
    try {
      const client = await JellyfinApiClient.create();
      setPlayableMedia(episode);
      setStreamUrl(client.getStreamUrl(episode.id));
      setStartPosition(0);
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
        let targetMedia: Media;

        if (mediaData.mediaType === 'tv') {
          const episodesList = await repository.getEpisodes(mediaId);
          setEpisodes(episodesList);

          if (episodesList.length > 0) {
            targetMedia = episodesList[0];
            setPlayableMedia(targetMedia);
            setStreamUrl(client.getStreamUrl(targetMedia.id));
          } else {
            throw new Error('Esta serie no tiene episodios disponibles.');
          }
        } else if (mediaData.mediaType === 'episode') {
          targetMedia = mediaData;
          setPlayableMedia(targetMedia);
          setStreamUrl(client.getStreamUrl(mediaId));
          if (mediaData.seriesId) {
            try {
              const episodesList = await repository.getEpisodes(mediaData.seriesId);
              setEpisodes(episodesList);
            } catch (err) {
              console.error('Error loading sibling episodes:', err);
            }
          }
        } else {
          targetMedia = mediaData;
          setPlayableMedia(targetMedia);
          setStreamUrl(client.getStreamUrl(mediaId));
        }

        // Check if startPosition param is present in URL
        const explicitStartParam = searchParams.get('startPosition');
        if (explicitStartParam !== null) {
          const parsed = Number(explicitStartParam);
          setStartPosition(Number.isFinite(parsed) ? parsed : 0);
          setIsResumePromptOpen(false);
        } else {
          // Direct navigation: evaluate resume eligibility
          const eligibility = resumeService.evaluateEligibility({
            playbackPositionTicks: targetMedia.playbackPositionTicks,
            runtimeTicks: targetMedia.runtimeTicks,
          });

          if (eligibility.isResumable) {
            setResumeEligibility(eligibility);
            setIsResumePromptOpen(true);
            setStartPosition(null); // Wait for user decision
          } else {
            setStartPosition(0);
            setIsResumePromptOpen(false);
          }
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
  }, [mediaId, searchParams, navigate, resumeService]);

  const handleResume = useCallback(() => {
    if (resumeEligibility) {
      setStartPosition(resumeEligibility.savedPositionSeconds);
    } else {
      setStartPosition(0);
    }
    setIsResumePromptOpen(false);
  }, [resumeEligibility]);

  const handleRestart = useCallback(() => {
    setStartPosition(0);
    setIsResumePromptOpen(false);
  }, []);

  const handleResumeCancel = useCallback(() => {
    setIsResumePromptOpen(false);
    handleClose();
  }, [handleClose]);

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
      {startPosition !== null && (
        <VideoPlayer
          key={`${playableMedia.id}-${startPosition}`} // Re-mount player for new stream / position
          title={playableMedia.title}
          streamUrl={streamUrl}
          startPosition={startPosition}
          media={playableMedia}
          onClose={handleClose}
          onEnded={handleEnded}
        />
      )}

      <ResumeChoiceDialog
        isOpen={isResumePromptOpen}
        title={playableMedia.title}
        eligibility={resumeEligibility}
        onResume={handleResume}
        onRestart={handleRestart}
        onClose={handleResumeCancel}
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

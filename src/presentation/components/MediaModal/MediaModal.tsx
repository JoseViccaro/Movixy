import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Plus, Check, Star } from 'lucide-react';
import styles from './MediaModal.module.css';
import { useEpisodes, useSeasons } from '@/application/hooks/useMedia';
import { useFavoriteToggle } from '@/application/hooks/useFavorites';
import { useResumePlayback } from '@/application/hooks/useResumePlayback';
import { ResumeChoiceDialog } from '@/presentation/components/ResumeChoiceDialog/ResumeChoiceDialog';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import type { Media } from '@/domain/models/media.model';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';

interface MediaModalProps {
  media: Media;
  onClose: () => void;
  onPlay: (media: Media, startPositionSeconds?: number) => void;
}

export const MediaModal = ({ media, onClose, onPlay }: MediaModalProps) => {
  const userId = localStorage.getItem('movixy_user_id');
  const modalRef = useRef<HTMLDivElement>(null);

  // Resume playback hook
  const handleStartPlayback = useCallback(
    (targetMedia: Media, startPositionSeconds: number) => {
      onPlay(targetMedia, startPositionSeconds);
    },
    [onPlay]
  );

  const {
    isDialogOpen: isResumeDialogOpen,
    pendingMedia: resumePendingMedia,
    eligibility: resumeEligibility,
    requestPlay,
    handleResume,
    handleRestart,
    handleCancel: handleResumeCancel,
  } = useResumePlayback({
    onStartPlayback: handleStartPlayback,
  });

  // D-pad navigation for the modal
  useDpadNavigation({
    enabled: !isResumeDialogOpen,
    containerSelector: `.${styles.modal}`,
    onBack: onClose,
  });

  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);

  console.log(`[MediaModal] Opening: ${media.title} (Type: ${media.mediaType}, ID: ${media.id})`);

  // ─── TanStack Query Hooks ───
  const { data: seasons } = useSeasons(userId, media.id);
  const { data: episodes, isLoading: isLoadingEpisodes, error: episodesError } = useEpisodes(userId, media.id, selectedSeasonId);
  const { mutate: toggleFavorite, isPending: isToggling } = useFavoriteToggle(userId);

  if (episodesError) console.error('[MediaModal] Error loading episodes:', episodesError);
  if (episodes) console.log(`[MediaModal] Loaded ${episodes.length} episodes for season ${selectedSeasonId || 'all'}`);

  // Auto-select first season when seasons are loaded
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const timer = setTimeout(() => {
        setSelectedSeasonId(seasons[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [seasons, selectedSeasonId]);

  const isFavorite = media.isFavorite;
  const year = media.releaseDate?.split('-')[0] || 'N/A';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResumeDialogOpen) onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, isResumeDialogOpen]);

  const handleToggleFavorite = () => {
    toggleFavorite({ mediaId: media.id, isFavorite: !isFavorite });
  };
  
  return (
    <>
      <div 
        className={styles.overlay} 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          ref={modalRef}
          className={styles.modal} 
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Cerrar modal"
            data-focusable="true"
          >
            <X size={24} />
          </button>

          <div className={styles.hero}>
            <OptimizedImage 
              src={media.backdropPath} 
              alt={media.title}
              className={styles.backdrop}
              priority={true}
            />
            <div className={styles.heroGradient}></div>
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <h1 id="modal-title" className={styles.title}>{media.title}</h1>
              
              <div className={styles.meta}>
                <div className={styles.badge}>
                  <Star size={14} fill="#46d369" stroke="#46d369" />
                  <span className={styles.rating}>{media.voteAverage?.toFixed(1)}</span>
                </div>
                <span className={styles.year}>{year}</span>
                <span className={styles.typeBadge}>
                  {media.mediaType === 'tv' ? 'Serie' : 'Película'}
                </span>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button 
                className={styles.playButton} 
                onClick={() => requestPlay(media)}
                aria-label={`Reproducir ${media.title}`}
                data-focusable="true"
              >
                <Play fill="black" size={24} />
                <span>Reproducir</span>
              </button>

              <button 
                className={styles.actionButton} 
                onClick={handleToggleFavorite}
                disabled={isToggling}
                aria-label={isFavorite ? 'Quitar de mi lista' : 'Agregar a mi lista'}
                aria-pressed={isFavorite}
                data-focusable="true"
              >
                {isFavorite ? <Check size={20} className={styles.activeIcon} /> : <Plus size={20} />}
              </button>
            </div>

            <p className={styles.overview}>{media.overview}</p>

            {media.mediaType !== 'movie' && (
              <div className={styles.episodesSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.episodesTitle}>Episodios</h2>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {seasons && seasons.length > 0 && (
                      <select 
                        className={styles.seasonSelector}
                        value={selectedSeasonId}
                        onChange={(e) => setSelectedSeasonId(e.target.value)}
                        data-focusable="true"
                      >
                        {seasons.map((season) => (
                          <option key={season.id} value={season.id}>
                            {season.title}
                          </option>
                        ))}
                      </select>
                    )}
                    {episodes && episodes.length > 0 && <span className={styles.count}>{episodes.length} episodios</span>}
                  </div>
                </div>

                {isLoadingEpisodes ? (
                  <div className={styles.episodesSkeleton}>
                    {[1, 2, 3].map(i => <div key={i} className={styles.skeletonRow}></div>)}
                  </div>
                ) : episodes && episodes.length > 0 ? (
                  <div className={styles.episodesList}>
                    {episodes.map((episode, index) => (
                      <div 
                        key={episode.id} 
                        className={styles.episodeRow} 
                        onClick={() => requestPlay(episode)}
                        role="button"
                        tabIndex={0}
                        data-focusable="true"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            requestPlay(episode);
                          }
                        }}
                      >
                        <span className={styles.episodeNumber}>{index + 1}</span>
                        <div className={styles.episodeThumbnailWrapper}>
                           <OptimizedImage 
                              src={episode.backdropPath || media.backdropPath} 
                              alt={episode.title}
                              className={styles.episodeThumbnail}
                           />
                           <div className={styles.episodePlayOverlay}>
                              <Play size={20} fill="white" />
                           </div>
                        </div>
                        <div className={styles.episodeInfo}>
                          <div className={styles.episodeInfoHeader}>
                            <h4 className={styles.episodeName}>{episode.title}</h4>
                          </div>
                          <p className={styles.episodeOverview}>
                            {episode.overview || 'Sin descripción disponible para este episodio.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <p>No se encontraron episodios disponibles.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>ID: {media.id}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ResumeChoiceDialog
        isOpen={isResumeDialogOpen}
        title={resumePendingMedia?.title || media.title}
        eligibility={resumeEligibility}
        onResume={handleResume}
        onRestart={handleRestart}
        onClose={handleResumeCancel}
      />
    </>
  );
};

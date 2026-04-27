import { useEffect, useRef } from 'react';
import { X, Play, Plus, Check, Star } from 'lucide-react';
import styles from './MediaModal.module.css';
import { useEpisodes } from '@/application/hooks/useMedia';
import { useFavoriteToggle } from '@/application/hooks/useFavorites';
import { OptimizedImage } from '@/presentation/components/OptimizedImage/OptimizedImage';
import type { Media } from '@/domain/models/media.model';

interface MediaModalProps {
  media: Media;
  onClose: () => void;
  onPlay: (media: Media) => void;
}

export const MediaModal = ({ media, onClose, onPlay }: MediaModalProps) => {
  const userId = localStorage.getItem('movixy_user_id');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ─── TanStack Query Hooks ───
  const { data: episodes, isLoading: isLoadingEpisodes } = useEpisodes(userId, media.id);
  const { mutate: toggleFavorite, isPending: isToggling } = useFavoriteToggle(userId);

  const isFavorite = media.isFavorite; // Ya viene normalizado por el repositorio
  const year = media.releaseDate?.split('-')[0] || 'N/A';

  useEffect(() => {
    closeButtonRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleToggleFavorite = () => {
    toggleFavorite({ mediaId: media.id, isFavorite: !isFavorite });
  };
  
  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <button 
          ref={closeButtonRef}
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Cerrar modal"
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
              onClick={() => onPlay(media)}
            >
              <Play fill="black" size={24} />
              <span>Reproducir</span>
            </button>

            <button 
              className={styles.actionButton} 
              onClick={handleToggleFavorite}
              disabled={isToggling}
              title={isFavorite ? 'Quitar de mi lista' : 'Agregar a mi lista'}
            >
              {isFavorite ? <Check size={20} className={styles.activeIcon} /> : <Plus size={20} />}
            </button>
          </div>

          <p className={styles.overview}>{media.overview}</p>

          {media.mediaType === 'tv' && (
            <div className={styles.episodesSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.episodesTitle}>Episodios</h2>
                {episodes && <span className={styles.count}>{episodes.length} episodios</span>}
              </div>

              {isLoadingEpisodes ? (
                <div className={styles.episodesSkeleton}>
                  {[1, 2, 3].map(i => <div key={i} className={styles.skeletonRow}></div>)}
                </div>
              ) : (
                <div className={styles.episodesList}>
                  {episodes?.map((episode, index) => (
                    <div 
                      key={episode.id} 
                      className={styles.episodeRow} 
                      onClick={() => onPlay(episode)}
                      role="button"
                      tabIndex={0}
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

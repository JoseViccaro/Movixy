import { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, Check } from 'lucide-react';
import styles from './MediaModal.module.css';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import type { Media } from '@/domain/models/media.model';

interface MediaModalProps {
  media: Media;
  onClose: () => void;
  onPlay: (media: Media) => void;
}

export const MediaModal = ({ media, onClose, onPlay }: MediaModalProps) => {
  const [episodes, setEpisodes] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const year = media.releaseDate?.split('-')[0] || 'N/A';
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  useEffect(() => {
    if (media.mediaType === 'tv') {
      const fetchEpisodes = async () => {
        setIsLoading(true);
        try {
          const client = new JellyfinApiClient();
          const userId = localStorage.getItem('movixy_user_id')!;
          const repository = new JellyfinMediaRepository(client, userId);
          const data = await repository.getEpisodes(media.id);
          setEpisodes(data);
        } catch (error) {
          console.error('Error fetching episodes:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEpisodes();
    }
  }, [media.id, media.mediaType]);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const client = new JellyfinApiClient();
        const userId = localStorage.getItem('movixy_user_id')!;
        const repository = new JellyfinMediaRepository(client, userId);
        const favorite = await repository.isFavorite(media.id);
        setIsFavorite(favorite);
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    };
    checkFavorite();
  }, [media.id]);

  const handleToggleFavorite = async () => {
    setIsFavoriteLoading(true);
    try {
      const client = new JellyfinApiClient();
      const userId = localStorage.getItem('movixy_user_id')!;
      const repository = new JellyfinMediaRepository(client, userId);
      const newFavoriteState = !isFavorite;
      await repository.toggleFavorite(media.id, newFavoriteState);
      setIsFavorite(newFavoriteState);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
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
          <img 
            src={media.backdropPath} 
            alt={`Imagen de ${media.title}`}
            className={styles.backdrop} 
          />
          <div className={styles.heroGradient}></div>
        </div>

        <div className={styles.content}>
          <h1 id="modal-title" className={styles.title}>{media.title}</h1>
          
          <div className={styles.actions}>
            <button 
              className={styles.playButton} 
              onClick={() => onPlay(media)}
              aria-label={`Reproducir ${media.title}`}
            >
              <Play fill="black" size={24} />
              <span>Reproducir</span>
            </button>

            <button 
              className={styles.actionButton} 
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              aria-label={isFavorite ? 'Quitar de mi lista' : 'Agregar a mi lista'}
              aria-pressed={isFavorite}
            >
              {isFavorite ? <Check size={20} /> : <Plus size={20} />}
            </button>
          </div>

          <div className={styles.meta}>
            <span className={styles.rating} aria-label={`Calificación: ${media.voteAverage} estrellas`}>{media.voteAverage} ★</span>
            <span>{year}</span>
            <span>{media.mediaType === 'tv' ? 'Serie' : 'Película'}</span>
          </div>

          <p className={styles.overview}>{media.overview}</p>

          {media.mediaType === 'tv' && (
            <div className={styles.episodesSection}>
              <h2 className={styles.episodesTitle}>Episodios</h2>
              {isLoading ? (
                <p className={styles.loadingText}>Cargando episodios...</p>
              ) : (
                <div className={styles.episodesList} role="list" aria-label="Lista de episodios">
                  {episodes.map((episode) => (
                    <div 
                      key={episode.id} 
                      className={styles.episodeRow} 
                      onClick={() => onPlay(episode)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onPlay(episode);
                        }
                      }}
                    >
                      <div className={styles.episodePlay} aria-hidden="true">
                        <Play size={16} fill="white" />
                      </div>
                      <div className={styles.episodeInfo}>
                        <h4 className={styles.episodeName}>{episode.title}</h4>
                        <p className={styles.episodeOverview}>{episode.overview || 'Sin descripción disponible.'}</p>
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

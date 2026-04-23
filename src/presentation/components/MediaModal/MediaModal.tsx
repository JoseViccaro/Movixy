import { useEffect, useState } from 'react';
import { X, Play } from 'lucide-react';
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
  const year = media.releaseDate?.split('-')[0] || 'N/A';

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
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.hero}>
          <img 
            src={media.backdropPath} 
            alt={media.title} 
            className={styles.backdrop} 
          />
          <div className={styles.heroGradient}></div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>{media.title}</h1>
          
          <div className={styles.actions}>
            <button 
              className={styles.playButton} 
              onClick={() => onPlay(media)}
            >
              <Play fill="black" size={24} />
              <span>Reproducir</span>
            </button>
          </div>

          <div className={styles.meta}>
            <span className={styles.rating}>{media.voteAverage} ★</span>
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
                <div className={styles.episodesList}>
                  {episodes.map((episode) => (
                    <div key={episode.id} className={styles.episodeRow} onClick={() => onPlay(episode)}>
                      <div className={styles.episodePlay}>
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

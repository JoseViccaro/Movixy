import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './TrailerModal.module.css';

interface TrailerModalProps {
  title: string;
  onClose: () => void;
}

export const TrailerModal = ({ title, onClose }: TrailerModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        e.key === 'GoBack' ||
        (e as KeyboardEvent & { keyCode: number }).keyCode === 4
      ) {
        e.preventDefault();
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

  // Construct YouTube search URL - this is a simple approach
  // In production, you'd want to use TMDB API or YouTube Data API
  const searchQuery = encodeURIComponent(`${title} trailer official`);
  // Alternative: Use a more direct approach with a popular trailer search
  // For a better implementation, use TMDB API to get the actual trailer key
  const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor de trailer"
    >
      <div 
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Cerrar trailer"
          ref={(el) => el?.focus()}
        >
          <X size={24} />
        </button>
        
        <div className={styles.videoContainer}>
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed?search=${searchQuery}`}
            title={`Trailer de ${title}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.iframe}
          />
          <div className={styles.fallback}>
            <p>Si el video no carga, <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">busca el trailer en YouTube</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

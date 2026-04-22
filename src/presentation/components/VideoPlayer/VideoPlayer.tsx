import { X } from 'lucide-react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  title: string;
}

export const VideoPlayer = ({ streamUrl, onClose, title }: VideoPlayerProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <video 
          controls 
          autoPlay 
          className={styles.video}
          src={streamUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

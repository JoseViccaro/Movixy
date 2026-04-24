import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Hls from 'hls.js';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  title: string;
}

export const VideoPlayer = ({ streamUrl, onClose, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  console.log('--- DEPURACIÓN DE VIDEO ---');
  console.log('URL de Streaming:', streamUrl);
  console.log('---------------------------');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    // Si el navegador soporta HLS de forma nativa (como Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((err) => console.log('Autoplay native preventer:', err));
      });
    } 
    // Si no, usamos hls.js (Chrome, Firefox, Edge, etc.)
    else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30, // Segundos de buffer a mantener
        maxMaxBufferLength: 600, // Máximo tamaño de buffer posible
        maxBufferSize: 60 * 1000 * 1000, // 60MB máximo
        lowLatencyMode: false, // Mejor para streams bajo demanda
      });
      
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('Error de HLS:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Error de red fatal, intentando recuperar...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Error de media fatal, intentando recuperar...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Error fatal irrecuperable');
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      // Explicitly play after manifest is parsed to ensure autoplay works
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => {
          console.log('El navegador bloqueó el autoplay:', err);
        });
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

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
          ref={videoRef}
          controls 
          autoPlay 
          className={styles.video}
        >
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    </div>
  );
};

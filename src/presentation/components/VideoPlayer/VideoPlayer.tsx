import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { X, Subtitles, ChevronDown, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  title: string;
}

interface SubtitleTrack {
  id: number;
  name: string;
  lang: string;
}

export const VideoPlayer = ({ streamUrl, onClose, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<number>(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleKeyDownGlobal = useRef((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleMute();
    }
    if (e.key === ' ') {
      e.preventDefault();
      togglePlayPause();
    }
    if (e.key === 'ArrowLeft') {
      seek(-10);
    }
    if (e.key === 'ArrowRight') {
      seek(10);
    }
    if (e.key === 'ArrowUp') {
      adjustVolume(0.1);
    }
    if (e.key === 'ArrowDown') {
      adjustVolume(-0.1);
    }
  });

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      video.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const handler = handleKeyDownGlobal.current;
      if (handler) handler(e as unknown as KeyboardEvent);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadSubtitleTracks = (hlsInstance: Hls) => {
      const tracks: SubtitleTrack[] = [];
      try {
        const hlsTracks = hlsInstance.subtitleTrack;
        if (hlsTracks) {
          Object.entries(hlsTracks).forEach(([id, track]) => {
            if (track && (track.lang || track.name || track.label)) {
              tracks.push({
                id: Number(id),
                name: track.name || track.label || track.lang || `Track ${id}`,
                lang: track.lang || 'unknown'
              });
            }
          });
        }
      } catch {
        console.log('No subtitle tracks available');
      }
      setSubtitleTracks(tracks);
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((err) => console.log('Autoplay prevented:', err));
      });
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        lowLatencyMode: false,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loadSubtitleTracks(hls);
        video.play().catch((err) => {
          console.log('Autoplay blocked:', err);
        });
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  const handleSubtitleChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackId;
      setCurrentSubtitle(trackId);
    }
    setShowSubtitlesMenu(false);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Reproductor de video">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.headerActions}>
            <button 
              className={styles.controlButton}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button 
              className={styles.controlButton}
              onClick={toggleMute}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            {subtitleTracks.length > 0 && (
              <div className={styles.subtitlesMenuContainer}>
                <button 
                  className={styles.subtitlesButton}
                  onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}
                  aria-label="Subtítulos"
                  aria-haspopup="menu"
                  aria-expanded={showSubtitlesMenu}
                >
                  <Subtitles size={20} />
                  <span>CC</span>
                  <ChevronDown size={16} />
                </button>
                {showSubtitlesMenu && (
                  <div className={styles.subtitlesMenu} role="menu" aria-label="Opciones de subtítulos">
                    <button 
                      className={`${styles.subtitleOption} ${currentSubtitle === -1 ? styles.active : ''}`}
                      onClick={() => handleSubtitleChange(-1)}
                      role="menuitem"
                    >
                      Desactivados
                    </button>
                    {subtitleTracks.map((track) => (
                      <button
                        key={track.id}
                        className={`${styles.subtitleOption} ${currentSubtitle === track.id ? styles.active : ''}`}
                        onClick={() => handleSubtitleChange(track.id)}
                        role="menuitem"
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar reproductor">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <video 
          ref={videoRef}
          controls 
          autoPlay 
          className={styles.video}
          aria-label={`Reproduciendo: ${title}`}
        >
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    </div>
  );
};
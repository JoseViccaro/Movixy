import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Subtitles, Maximize2, Minimize2, Volume2, VolumeX, Languages, Settings } from 'lucide-react';
import Hls from 'hls.js';
import { useFullscreen } from '@/presentation/hooks/useFullscreen';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  onEnded?: () => void;
  title: string;
}

interface SubtitleTrack {
  id: number;
  name: string;
  lang: string;
}

interface AudioTrack {
  id: number;
  name: string;
  lang: string;
}

interface SubtitleSettings {
  fontSize: 'small' | 'normal' | 'large';
  color: 'white' | 'yellow' | 'cyan';
  background: 'none' | 'shadow' | 'solid';
}

export const VideoPlayer = ({ streamUrl, onClose, onEnded, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 'normal',
    color: 'white',
    background: 'shadow',
  });
  
  const [currentSubtitle, setCurrentSubtitle] = useState<number>(-1);
  const [currentAudio, setCurrentAudio] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isPaused, setIsPaused] = useState(false);

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (!showSubtitlesMenu && !showAudioMenu && !showSubtitleSettings) {
        setShowControls(false);
      }
    }, 4000);
  }, [showSubtitlesMenu, showAudioMenu, showSubtitleSettings]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    resetHideTimer();
  }, [resetHideTimer]);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen(containerRef.current || undefined);
    resetHideTimer();
  }, [toggleFullscreen, resetHideTimer]);

  // Keyboard controls (works with TV remote too)
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      resetHideTimer();

      switch (e.key) {
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (showSubtitleSettings) {
            setShowSubtitleSettings(false);
            setShowSubtitlesMenu(true);
          } else if (showSubtitlesMenu || showAudioMenu) {
            setShowSubtitlesMenu(false);
            setShowAudioMenu(false);
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case ' ':
        case 'Enter':
          if (!showControls) {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          if (!showControls) {
            e.preventDefault();
            seek(-10);
          }
          break;
        case 'ArrowRight':
          if (!showControls) {
            e.preventDefault();
            seek(10);
          }
          break;
        case 'ArrowUp':
          if (!showControls) {
            e.preventDefault();
            adjustVolume(0.1);
          }
          break;
        case 'ArrowDown':
          if (!showControls) {
            e.preventDefault();
            adjustVolume(-0.1);
          }
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setShowSubtitlesMenu(prev => !prev);
          setShowAudioMenu(false);
          setShowSubtitleSettings(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, handleToggleFullscreen, toggleMute, togglePlayPause, seek, adjustVolume, resetHideTimer, showControls, showSubtitlesMenu, showAudioMenu, showSubtitleSettings]);

  // Video time tracking and events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(formatTime(video.currentTime));
      }
    };

    const onDurationChange = () => {
      setDuration(formatTime(video.duration));
    };

    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  // HLS initialization with subtitle and audio track detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
        // Load subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          const subs: SubtitleTrack[] = hls.subtitleTracks.map((track, idx) => ({
            id: idx,
            name: track.name || track.lang || `Subtitle ${idx + 1}`,
            lang: track.lang || 'unknown',
          }));
          setSubtitleTracks(subs);
        }

        // Load audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 1) {
          const audios: AudioTrack[] = hls.audioTracks.map((track, idx) => ({
            id: idx,
            name: track.name || track.lang || `Audio ${idx + 1}`,
            lang: track.lang || 'unknown',
          }));
          setAudioTracks(audios);
          setCurrentAudio(hls.audioTrack);
        }

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
      hlsRef.current.subtitleDisplay = trackId !== -1;
      setCurrentSubtitle(trackId);
    }
    setShowSubtitlesMenu(false);
  };

  const handleAudioChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setCurrentAudio(trackId);
    }
    setShowAudioMenu(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    video.currentTime = clickPosition * video.duration;
  };

  return (
    <div
      ref={containerRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor de video"
      onMouseMove={resetHideTimer}
      onClick={togglePlayPause}
      data-sub-size={subtitleSettings.fontSize}
      data-sub-color={subtitleSettings.color}
      data-sub-bg={subtitleSettings.background}
    >
      <video
        ref={videoRef}
        autoPlay
        className={styles.video}
        aria-label={`Reproduciendo: ${title}`}
      >
        Tu navegador no soporta la reproducción de video.
      </video>

      {/* Custom controls overlay */}
      <div
        className={`${styles.controlsOverlay} ${showControls ? styles.visible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={onClose} aria-label="Cerrar reproductor" data-focusable="true">
            <X size={28} />
          </button>
          <h2 className={styles.title}>{title}</h2>
          <div style={{ width: 28 }} />
        </div>

        {/* Center play/pause indicator */}
        {isPaused && (
          <div className={styles.centerPlay}>
            <div className={styles.playIcon}>▶</div>
          </div>
        )}

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          {/* Progress bar */}
          <div className={styles.progressContainer} onClick={handleProgressClick}>
            <div className={styles.progressBuffered} style={{ width: `${buffered}%` }} />
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.controlsLeft}>
              <button className={styles.controlBtn} onClick={togglePlayPause} aria-label={isPaused ? 'Reproducir' : 'Pausar'}>
                {isPaused ? '▶' : '⏸'}
              </button>
              <button className={styles.controlBtn} onClick={toggleMute} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <span className={styles.timeDisplay}>
                {currentTime} / {duration}
              </span>
            </div>

            <div className={styles.controlsRight}>
              {/* Subtitles */}
              {subtitleTracks.length > 0 && (
                <div className={styles.menuContainer}>
                  <button
                    className={`${styles.controlBtn} ${currentSubtitle >= 0 ? styles.active : ''}`}
                    onClick={() => { 
                      setShowSubtitlesMenu(!showSubtitlesMenu); 
                      setShowAudioMenu(false);
                      setShowSubtitleSettings(false);
                    }}
                    aria-label="Subtítulos"
                    aria-haspopup="menu"
                    aria-expanded={showSubtitlesMenu}
                    data-focusable="true"
                  >
                    <Subtitles size={22} />
                  </button>
                  {showSubtitlesMenu && (
                    <div className={styles.trackMenu} role="menu" aria-label="Opciones de subtítulos">
                      <div className={styles.trackMenuTitle}>Subtítulos</div>
                      <button
                        className={`${styles.trackOption} ${currentSubtitle === -1 ? styles.active : ''}`}
                        onClick={() => handleSubtitleChange(-1)}
                        role="menuitem"
                        data-focusable="true"
                      >
                        Desactivados
                      </button>
                      {subtitleTracks.map((track) => (
                        <button
                          key={track.id}
                          className={`${styles.trackOption} ${currentSubtitle === track.id ? styles.active : ''}`}
                          onClick={() => handleSubtitleChange(track.id)}
                          role="menuitem"
                          data-focusable="true"
                        >
                          {track.name}
                          <span className={styles.trackLang}>{track.lang}</span>
                        </button>
                      ))}
                      <div className={styles.divider} />
                      <button 
                        className={styles.settingsLink} 
                        onClick={() => { setShowSubtitleSettings(true); setShowSubtitlesMenu(false); }}
                        data-focusable="true"
                      >
                        <Settings size={14} /> Ajustes de subtítulos
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Subtitle Settings Menu */}
              {showSubtitleSettings && (
                <div className={styles.menuContainer}>
                   <div className={styles.trackMenu} style={{ right: 0, minWidth: '240px' }}>
                      <div className={styles.trackMenuTitle}>Ajustes de Subtítulos</div>
                      
                      <div className={styles.settingSection}>
                        <p className={styles.settingLabel}>Tamaño</p>
                        <div className={styles.settingOptions}>
                          {(['small', 'normal', 'large'] as const).map(size => (
                            <button 
                              key={size}
                              className={`${styles.settingOption} ${subtitleSettings.fontSize === size ? styles.active : ''}`}
                              onClick={() => setSubtitleSettings({...subtitleSettings, fontSize: size})}
                              data-focusable="true"
                            >
                              {size === 'small' ? 'Pequ' : size === 'normal' ? 'Norm' : 'Gran'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.settingSection}>
                        <p className={styles.settingLabel}>Color</p>
                        <div className={styles.settingOptions}>
                          {(['white', 'yellow', 'cyan'] as const).map(color => (
                            <button 
                              key={color}
                              className={`${styles.settingOption} ${subtitleSettings.color === color ? styles.active : ''}`}
                              onClick={() => setSubtitleSettings({...subtitleSettings, color})}
                              data-focusable="true"
                            >
                              <div className={styles.colorCircle} style={{ backgroundColor: color }} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.settingSection}>
                        <p className={styles.settingLabel}>Fondo</p>
                        <div className={styles.settingOptions}>
                          {(['none', 'shadow', 'solid'] as const).map(bg => (
                            <button 
                              key={bg}
                              className={`${styles.settingOption} ${subtitleSettings.background === bg ? styles.active : ''}`}
                              onClick={() => setSubtitleSettings({...subtitleSettings, background: bg})}
                              data-focusable="true"
                            >
                              {bg === 'none' ? 'Sin' : bg === 'shadow' ? 'Somb' : 'Fondo'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        className={styles.backToMenu} 
                        onClick={() => { setShowSubtitleSettings(false); setShowSubtitlesMenu(true); }}
                        data-focusable="true"
                      >
                        ← Volver a pistas
                      </button>
                   </div>
                </div>
              )}

              {/* Audio tracks */}
              {audioTracks.length > 1 && (
                <div className={styles.menuContainer}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => { setShowAudioMenu(!showAudioMenu); setShowSubtitlesMenu(false); }}
                    aria-label="Pista de audio"
                    aria-haspopup="menu"
                    aria-expanded={showAudioMenu}
                  >
                    <Languages size={22} />
                  </button>
                  {showAudioMenu && (
                    <div className={styles.trackMenu} role="menu" aria-label="Opciones de audio">
                      <div className={styles.trackMenuTitle}>Audio</div>
                      {audioTracks.map((track) => (
                        <button
                          key={track.id}
                          className={`${styles.trackOption} ${currentAudio === track.id ? styles.active : ''}`}
                          onClick={() => handleAudioChange(track.id)}
                          role="menuitem"
                        >
                          {track.name}
                          <span className={styles.trackLang}>{track.lang}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button
                className={styles.controlBtn}
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
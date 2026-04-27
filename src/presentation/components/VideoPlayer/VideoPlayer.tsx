import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Subtitles,
  ChevronDown,
  Settings,
} from 'lucide-react';
import Hls from 'hls.js';
import { useToast } from '@/presentation/components/Toast/ToastContext';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  title: string;
  startPosition?: number;
}

interface SubtitleTrack {
  id: number;
  name: string;
  lang: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const VideoPlayer = ({ streamUrl, onClose, title, startPosition }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(-1);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const { addToast } = useToast();
  const [seekIndicator, setSeekIndicator] = useState<{ direction: 'forward' | 'back'; visible: boolean }>({
    direction: 'forward',
    visible: false,
  });

  // ── Auto-hide controls ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  // ── Seek indicator flash ──────────────────────────────────────────────────
  const flashSeek = (direction: 'forward' | 'back') => {
    setSeekIndicator({ direction, visible: true });
    setTimeout(() => setSeekIndicator((s) => ({ ...s, visible: false })), 700);
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
    resetHideTimer();
  }, [resetHideTimer]);

  const seek = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
    flashSeek(seconds > 0 ? 'forward' : 'back');
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) v.muted = false;
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const handleSpeedChange = (speed: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetHideTimer();
  };

  const handleSubtitleChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackId;
      setCurrentSubtitle(trackId);
    }
    setShowSubtitlesMenu(false);
  };

  // ── Progress bar ──────────────────────────────────────────────────────────
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !isFinite(v.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
    resetHideTimer();
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !isFinite(v.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverTime({ time: ratio * v.duration, x: e.clientX - rect.left });
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape': onClose(); break;
        case ' ':
        case 'k': e.preventDefault(); togglePlayPause(); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
        case 'ArrowRight': seek(10); break;
        case 'ArrowLeft': seek(-10); break;
        case 'ArrowUp': e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, togglePlayPause, toggleFullscreen, toggleMute, seek, volume, handleVolumeChange]);

  // ── Wake Lock (Keep screen on) ──────────────────────────────────────────
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        }
      } catch (err: unknown) {
        console.error('Wake Lock failed:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── HLS / video source setup ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setDuration(video.duration);
      if (startPosition && startPosition > 0) video.currentTime = startPosition;
      video.play().catch(() => {});
    };

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', onLoaded);
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
          const lastPos = video.currentTime;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              hls.recoverMediaError();
              // Forzamos el salto a la última posición conocida tras recuperar
              setTimeout(() => {
                if (video.currentTime === 0 && lastPos > 0) {
                  video.currentTime = lastPos;
                  video.play().catch(() => {});
                }
              }, 100);
              break;
            default:
              addToast('error', 'Error crítico de reproducción. Revisá el servidor o el formato del archivo.');
              hls.destroy();
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Collect subtitle tracks
        const tracks: SubtitleTrack[] = hls.subtitleTracks.map((t, i) => ({
          id: i,
          name: t.name || t.lang || `Track ${i}`,
          lang: t.lang || 'unknown',
        }));
        setSubtitleTracks(tracks);
        setDuration(video.duration);
        if (startPosition && startPosition > 0) video.currentTime = startPosition;
        video.play().catch(() => {});
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    }

    resetHideTimer();

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadedmetadata', onLoaded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, startPosition, resetHideTimer, addToast]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={styles.playerRoot}
      onMouseMove={resetHideTimer}
      onClick={() => {
        setShowSubtitlesMenu(false);
        setShowSpeedMenu(false);
      }}
    >
      {/* ── Video Element ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className={styles.video}
        onClick={togglePlayPause}
        playsInline
      />

      {/* ── Seek Flash Indicators ────────────────────────────────────────── */}
      {seekIndicator.visible && (
        <div className={`${styles.seekIndicator} ${seekIndicator.direction === 'forward' ? styles.seekRight : styles.seekLeft}`}>
          {seekIndicator.direction === 'forward'
            ? <><SkipForward size={32} /><span>+10s</span></>
            : <><SkipBack size={32} /><span>-10s</span></>
          }
        </div>
      )}

      {/* ── Buffering Spinner ────────────────────────────────────────────── */}
      {isBuffering && (
        <div className={styles.bufferingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* ── Controls Overlay ─────────────────────────────────────────────── */}
      <div className={`${styles.controls} ${showControls ? styles.controlsVisible : styles.controlsHidden}`}>

        {/* ─ Top Bar: Title + Close ──────────────────────────────────────── */}
        <div className={styles.topBar}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        {/* ─ Center: Big Play/Pause on click area ───────────────────────── */}
        <div className={styles.centerArea} onClick={togglePlayPause} />

        {/* ─ Bottom Controls ────────────────────────────────────────────── */}
        <div className={styles.bottomBar}>

          {/* Progress bar */}
          <div
            ref={progressRef}
            className={styles.progressContainer}
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
            aria-label="Barra de progreso"
          >
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
            </div>
            {hoverTime && (
              <div className={styles.hoverTime} style={{ left: hoverTime.x }}>
                {formatTime(hoverTime.time)}
              </div>
            )}
          </div>

          {/* Bottom row: left controls + time + right controls */}
          <div className={styles.bottomRow}>
            {/* Left */}
            <div className={styles.leftControls}>
              <button className={styles.iconBtn} onClick={() => seek(-10)} aria-label="Retroceder 10s">
                <SkipBack size={20} />
              </button>
              <button className={styles.iconBtn} onClick={togglePlayPause} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
              </button>
              <button className={styles.iconBtn} onClick={() => seek(10)} aria-label="Adelantar 10s">
                <SkipForward size={20} />
              </button>

              {/* Volume */}
              <div className={styles.volumeGroup}>
                <button className={styles.iconBtn} onClick={toggleMute} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  className={styles.volumeSlider}
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  aria-label="Volumen"
                />
              </div>

              <span className={styles.time}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right */}
            <div className={styles.rightControls} onClick={(e) => e.stopPropagation()}>

              {/* Speed selector */}
              <div className={styles.menuWrapper}>
                <button
                  className={styles.textBtn}
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSubtitlesMenu(false); }}
                  aria-label="Velocidad de reproducción"
                >
                  <Settings size={16} />
                  <span>{playbackSpeed}x</span>
                </button>
                {showSpeedMenu && (
                  <div className={styles.dropdownMenu}>
                    <p className={styles.menuLabel}>Velocidad</p>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        className={`${styles.menuItem} ${playbackSpeed === s ? styles.menuItemActive : ''}`}
                        onClick={() => handleSpeedChange(s)}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitles selector */}
              {subtitleTracks.length > 0 && (
                <div className={styles.menuWrapper}>
                  <button
                    className={styles.textBtn}
                    onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSpeedMenu(false); }}
                    aria-label="Subtítulos"
                  >
                    <Subtitles size={16} />
                    <span>CC</span>
                    <ChevronDown size={14} />
                  </button>
                  {showSubtitlesMenu && (
                    <div className={styles.dropdownMenu}>
                      <p className={styles.menuLabel}>Subtítulos</p>
                      <button
                        className={`${styles.menuItem} ${currentSubtitle === -1 ? styles.menuItemActive : ''}`}
                        onClick={() => handleSubtitleChange(-1)}
                      >
                        Desactivados
                      </button>
                      {subtitleTracks.map((track) => (
                        <button
                          key={track.id}
                          className={`${styles.menuItem} ${currentSubtitle === track.id ? styles.menuItemActive : ''}`}
                          onClick={() => handleSubtitleChange(track.id)}
                        >
                          {track.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button className={styles.iconBtn} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
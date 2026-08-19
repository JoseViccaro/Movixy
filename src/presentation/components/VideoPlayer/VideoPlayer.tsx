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
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Subtitles,
  ChevronDown,
  Settings,
  Languages,
  PictureInPicture,
} from 'lucide-react';
import Hls from 'hls.js';
import { useToast } from '@/presentation/components/Toast/ToastContext';
import { useFullscreen } from '@/presentation/hooks/useFullscreen';
import { usePlayerGestures } from '@/presentation/hooks/usePlayerGestures';
import { GestureHUD } from '@/presentation/components/VideoPlayer/GestureHUD';
import type { Media } from '@/domain/models/media.model';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { JellyfinMediaRepository } from '@/data/repositories/jellyfin-media.repository';
import { JellyfinTrickplayRepositoryImpl } from '@/data/repositories/jellyfin-trickplay.repository';
import { JellyfinChapterRepositoryImpl } from '@/data/repositories/jellyfin-chapter.repository';
import { CanvasThumbnailFallback } from '@/data/sources/CanvasThumbnailFallback';
import { useThumbnailScrub } from '@/application/hooks/useThumbnailScrub';
import { useChapterMarkers } from '@/application/hooks/useChapterMarkers';
import type { TrickplayManifest } from '@/domain/models/trickplay.model';
import type { ChapterMarker } from '@/domain/models/chapter-marker.model';
import { ThumbnailPreviewTooltip } from '@/presentation/components/VideoPlayer/ThumbnailPreviewTooltip';
import { SkipMarkerButton } from '@/presentation/components/VideoPlayer/SkipMarkerButton';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  streamUrl: string;
  onClose: () => void;
  onEnded?: () => void;
  title: string;
  startPosition?: number;
  media?: Partial<Media>;
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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const VideoPlayer = ({ streamUrl, onClose, onEnded, title, startPosition, media }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const [seekIndicator, setSeekIndicator] = useState<{ direction: 'forward' | 'back'; visible: boolean }>({
    direction: 'forward',
    visible: false,
  });
  const [isPiP, setIsPiP] = useState(false);
  const canPiP = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;

  // Track & Settings States (Windows additions)
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>(() => {
    if (!media?.subtitles) return [];
    return media.subtitles.map((s, i) => ({
      id: i,
      name: s.label || s.language || `Track ${i + 1}`,
      lang: s.language || 'unknown'
    }));
  });
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(() => {
    if (!media?.audioTracks) return [];
    return media.audioTracks.map((a, i) => ({
      id: i,
      name: a.label || a.language || `Audio ${i + 1}`,
      lang: a.language || 'unknown'
    }));
  });
  const [currentSubtitle, setCurrentSubtitle] = useState<number>(() => {
    return (media?.subtitles && media.subtitles.length > 0) ? 0 : -1;
  });
  const [currentAudio, setCurrentAudio] = useState<number>(0);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 'normal',
    color: 'white',
    background: 'shadow',
  });

  const [error, setError] = useState<string | null>(null);
  const [trickplayManifest, setTrickplayManifest] = useState<TrickplayManifest | null>(null);
  const [chapterMarkers, setChapterMarkers] = useState<ChapterMarker[]>([]);
  const [fallbackSnapshotUrl, setFallbackSnapshotUrl] = useState<string | null>(null);

  const trickplayRepoRef = useRef<JellyfinTrickplayRepositoryImpl | null>(null);
  const fallbackRef = useRef<CanvasThumbnailFallback | null>(null);

  // Initialize repositories and fetch trickplay & chapters
  useEffect(() => {
    let isMounted = true;
    fallbackRef.current = new CanvasThumbnailFallback();

    const loadTrickplayAndChapters = async () => {
      if (!media?.id) return;
      try {
        const client = await JellyfinApiClient.create();
        const userId = localStorage.getItem('movixy_user_id') || '';
        
        const trickplayRepo = new JellyfinTrickplayRepositoryImpl(client);
        trickplayRepoRef.current = trickplayRepo;
        const chapterRepo = new JellyfinChapterRepositoryImpl(client, userId);

        const [manifest, markers] = await Promise.all([
          trickplayRepo.getTrickplayManifest(media.id),
          chapterRepo.getChapterMarkers(media.id),
        ]);

        if (isMounted) {
          setTrickplayManifest(manifest);
          setChapterMarkers(markers);
        }
      } catch (e) {
        console.error('Failed to load trickplay or chapters:', e);
      }
    };

    loadTrickplayAndChapters();

    return () => {
      isMounted = false;
      if (fallbackRef.current) {
        fallbackRef.current.dispose();
      }
    };
  }, [media?.id]);

  // Scrub hook
  const { previewState, handleHover, handleLeave } = useThumbnailScrub({
    manifest: trickplayManifest,
    duration,
    trickplayRepo: trickplayRepoRef.current || undefined,
  });

  // Chapter skip hook
  const { activeSkipState } = useChapterMarkers({
    markers: chapterMarkers,
    currentTime,
  });

  const { addToast } = useToast();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const lastMousePos = useRef({ x: 0, y: 0 });

  const {
    hudState,
    brightness,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePlayerGestures({
    onVolumeChange: (newVol) => {
      handleVolumeChange(newVol);
    },
    onBrightnessChange: () => {},
    onSeek: (delta) => {
      seek(delta);
    },
    initialVolume: volume,
    currentTime,
    duration,
  });


  // ── Auto-hide controls ────────────────────────────────────────────────────
  const resetHideTimer = useCallback((e?: React.MouseEvent) => {
    // If it's a mouse move, check if it actually moved (avoids ghost moves on TV)
    if (e && e.type === 'mousemove') {
      const deltaX = Math.abs(e.clientX - lastMousePos.current.x);
      const deltaY = Math.abs(e.clientY - lastMousePos.current.y);
      if (deltaX < 2 && deltaY < 2) return; // Ignore micro-movements
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }

    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      const v = videoRef.current;
      // We hide if playing, or if it's been idle enough even when paused
      if (v && !showSubtitlesMenu && !showAudioMenu && !showSubtitleSettings && !showSpeedMenu) {
        setShowControls(false);
      }
    }, 3500); // Slightly faster hide (3.5s)
  }, [showSubtitlesMenu, showAudioMenu, showSubtitleSettings, showSpeedMenu]);

  // ── Seek indicator flash ──────────────────────────────────────────────────
  const flashSeek = (direction: 'forward' | 'back') => {
    setSeekIndicator({ direction, visible: true });
    setTimeout(() => setSeekIndicator((s) => ({ ...s, visible: false })), 700);
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const seek = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
    flashSeek(seconds > 0 ? 'forward' : 'back');
    resetHideTimer();
  }, [resetHideTimer]);

  const adjustVolume = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const newVolume = Math.max(0, Math.min(1, v.volume + delta));
    v.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
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

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen(containerRef.current || undefined);
    resetHideTimer();
  }, [toggleFullscreen, resetHideTimer]);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !canPiP) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
    resetHideTimer();
  }, [canPiP, resetHideTimer]);

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
      hlsRef.current.subtitleDisplay = trackId !== -1;
      setCurrentSubtitle(trackId);
    }
    setShowSubtitlesMenu(false);
    resetHideTimer();
  };

  const handleAudioChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setCurrentAudio(trackId);
    }
    setShowAudioMenu(false);
    resetHideTimer();
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
    const pixelX = e.clientX - rect.left;
    const ratio = pixelX / rect.width;
    const time = ratio * v.duration;
    setHoverTime({ time, x: pixelX });

    handleHover({
      pixelX,
      containerWidth: rect.width,
    });

    if (!trickplayManifest && fallbackRef.current && streamUrl) {
      fallbackRef.current.getThumbnail(streamUrl, time).then((snapshot) => {
        if (snapshot) {
          setFallbackSnapshotUrl(snapshot);
        }
      });
    }
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
    handleLeave();
  };

  const saveProgress = useCallback(async () => {
    if (!media?.id || !videoRef.current) return;
    const userId = localStorage.getItem('movixy_user_id');
    if (!userId) return;
    try {
      const client = await JellyfinApiClient.create();
      const repository = new JellyfinMediaRepository(client, userId);
      const positionTicks = Math.floor((videoRef.current.currentTime || 0) * 10_000_000);
      await repository.updatePlaybackPosition(media.id, positionTicks);
    } catch (err) {
      console.error('Playback sync failed:', err);
    }
  }, [media]);

  const handleClose = useCallback(async () => {
    await saveProgress();
    onClose();
  }, [saveProgress, onClose]);

  // Periodic progress sync loop (every 10 seconds of active playback)
  useEffect(() => {
    if (!isPlaying || !media?.id) return;

    const intervalId = setInterval(async () => {
      await saveProgress();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isPlaying, media?.id, saveProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  // ── Keyboard shortcuts (Fire TV & Remote optimized) ───────────────────────
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      resetHideTimer();

      // Detectar teclas de retroceso (control remoto de TV y teclado estándar)
      const isBackKey =
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        e.key === 'GoBack' ||
        (e as KeyboardEvent & { keyCode: number }).keyCode === 4;

      if (isBackKey) {
        // Si hay algún menú o configuración abierto, lo cerramos primero
        if (showSubtitleSettings) {
          e.preventDefault();
          setShowSubtitleSettings(false);
          setShowSubtitlesMenu(true);
        } else if (showSubtitlesMenu || showAudioMenu || showSpeedMenu) {
          e.preventDefault();
          setShowSubtitlesMenu(false);
          setShowAudioMenu(false);
          setShowSpeedMenu(false);
        } else {
          e.preventDefault();
          handleClose();
        }
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
        case 'k':
          // If controls are hidden, play/pause on Enter/Space
          if (!showControls) {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          handleToggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'ArrowRight':
          if (!showControls) {
            e.preventDefault();
            seek(10);
          }
          break;
        case 'ArrowLeft':
          if (!showControls) {
            e.preventDefault();
            seek(-10);
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
          setShowSpeedMenu(false);
          setShowSubtitleSettings(false);
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [handleClose, togglePlayPause, toggleMute, seek, adjustVolume, showControls, showSubtitlesMenu, showAudioMenu, showSpeedMenu, showSubtitleSettings, resetHideTimer]);

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



  // ── HLS / video source setup ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setDuration(video.duration);
      if (startPosition && startPosition > 0) {
        video.currentTime = startPosition;
      }
      video.play().catch(() => {});
    };

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onDurationChange = () => setDuration(video.duration);
    const handleEnded = () => { if (onEnded) onEnded(); };
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 10, // Menos buffer inicial para arrancar antes
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        lowLatencyMode: true, // ¡Baja latencia activada!
        backBufferLength: 30,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          const lastPos = video.currentTime;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              setTimeout(() => {
                if (video.currentTime === 0 && lastPos > 0) {
                  video.currentTime = lastPos;
                  video.play().catch(() => {});
                }
              }, 100);
              break;
            default:
              setError('Error crítico de reproducción. El servidor no responde o el formato no es compatible.');
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
          const subs: SubtitleTrack[] = hls.subtitleTracks.map((t, i) => ({
            id: i,
            name: t.name || t.lang || `Track ${i + 1}`,
            lang: t.lang || 'unknown',
          }));
          setSubtitleTracks(subs);
        }

        // Load audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 1) {
          const audios: AudioTrack[] = hls.audioTracks.map((t, i) => ({
            id: i,
            name: t.name || t.lang || `Audio ${i + 1}`,
            lang: t.lang || 'unknown',
          }));
          setAudioTracks(audios);
          setCurrentAudio(hls.audioTrack);
        }

        setDuration(video.duration);
        if (startPosition && startPosition > 0) video.currentTime = startPosition;
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', onLoaded);
    }

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
      video.removeEventListener('loadedmetadata', onLoaded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, startPosition, addToast, onEnded]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={styles.playerRoot}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ filter: brightness !== 1 ? `brightness(${brightness})` : undefined }}
      onMouseMove={resetHideTimer}
      onClick={() => {
        setShowSubtitlesMenu(false);
        setShowAudioMenu(false);
        setShowSpeedMenu(false);
        setShowSubtitleSettings(false);
      }}
      data-sub-size={subtitleSettings.fontSize}
      data-sub-color={subtitleSettings.color}
      data-sub-bg={subtitleSettings.background}
    >
      {/* ── Video Element ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className={styles.video}
        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
        playsInline
      />

      <GestureHUD state={hudState} />
      {/* ── Seek Flash Indicators ────────────────────────────────────────── */}
      {seekIndicator.visible && (
        <div className={`${styles.seekIndicator} ${seekIndicator.direction === 'forward' ? styles.seekRight : styles.seekLeft}`}>
          {seekIndicator.direction === 'forward'
            ? <><SkipForward size={32} /><span>+10s</span></>
            : <><SkipBack size={32} /><span>-10s</span></>
          }
        </div>
      )}

      {/* ── Buffering or Error Overlay ── */}
      {(isBuffering || !streamUrl || error) && (
        <div className={styles.bufferingOverlay}>
          {error ? (
            <div className={styles.errorContent}>
              <X size={48} color="#e50914" />
              <p className={styles.errorText}>{error}</p>
              <button 
                className={styles.retryBtn}
                onClick={() => window.location.reload()}
                data-focusable="true"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className={styles.spinner} />
              {!streamUrl && <p className={styles.loadingText}>Iniciando reproducción...</p>}
            </>
          )}
        </div>
      )}

      {/* ── Controls Overlay ─────────────────────────────────────────────── */}
      <div className={`${styles.controls} ${showControls ? styles.controlsVisible : styles.controlsHidden}`}>

        {/* ─ Top Bar: Title + Close ──────────────────────────────────────── */}
        <div className={styles.topBar}>
          <button className={styles.iconBtn} onClick={handleClose} aria-label="Cerrar" data-focusable="true">
            <X size={24} />
          </button>
          <h2 className={styles.title}>{title}</h2>
          <div style={{ width: 40 }} /> {/* Spacer */}
        </div>

        {/* ─ Center Area (Play/Pause indicator) ─────────────────────────── */}
        {!isPlaying && !isBuffering && (
          <div className={styles.centerPlayIndicator}>
             <Play size={64} fill="white" />
          </div>
        )}
        <div className={styles.centerArea} onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} />

        {/* ─ Skip Marker Overlay ────────────────────────────────────────── */}
        <SkipMarkerButton
          state={activeSkipState}
          onSkip={(targetTime) => {
            const v = videoRef.current;
            if (!v) return;
            v.currentTime = targetTime;
            resetHideTimer();
          }}
        />

        {/* ─ Bottom Controls ────────────────────────────────────────────── */}
        <div className={styles.bottomBar} onClick={(e) => e.stopPropagation()}>

          {/* Progress bar */}
          <div
            ref={progressRef}
            className={styles.progressContainer}
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            aria-label="Barra de progreso"
          >
            {previewState.visible && (
              <ThumbnailPreviewTooltip
                state={previewState}
                fallbackSnapshotUrl={fallbackSnapshotUrl}
              />
            )}
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
            </div>
            {hoverTime && !previewState.visible && (
              <div className={styles.hoverTime} style={{ left: hoverTime.x }}>
                {formatTime(hoverTime.time)}
              </div>
            )}
          </div>

          {/* Bottom row: left controls + time + right controls */}
          <div className={styles.bottomRow}>
            {/* Left */}
            <div className={styles.leftControls}>
              <button className={styles.iconBtn} onClick={() => seek(-10)} aria-label="Retroceder 10s" data-focusable="true">
                <SkipBack size={22} />
              </button>
              <button className={styles.iconBtn} onClick={togglePlayPause} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} data-focusable="true">
                {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" />}
              </button>
              <button className={styles.iconBtn} onClick={() => seek(10)} aria-label="Adelantar 10s" data-focusable="true">
                <SkipForward size={22} />
              </button>

              <div className={styles.volumeGroup}>
                <button className={styles.iconBtn} onClick={toggleMute} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'} data-focusable="true">
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
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
            <div className={styles.rightControls}>

              {/* Speed selector */}
              <div className={styles.menuWrapper}>
                <button
                  className={styles.textBtn}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu); 
                    setShowSubtitlesMenu(false); 
                    setShowAudioMenu(false);
                    setShowSubtitleSettings(false);
                  }}
                  aria-label="Velocidad de reproducción"
                  data-focusable="true"
                  data-testid="speed-selector"
                >
                  <Settings size={18} />
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
                        data-focusable="true"
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio tracks */}
              {audioTracks.length > 1 && (
                <div className={styles.menuWrapper}>
                  <button
                    className={styles.textBtn}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setShowAudioMenu(!showAudioMenu); 
                      setShowSubtitlesMenu(false); 
                      setShowSpeedMenu(false);
                      setShowSubtitleSettings(false);
                    }}
                    aria-label="Idioma de audio"
                    data-focusable="true"
                    data-testid="audio-selector"
                  >
                    <Languages size={18} />
                  </button>
                  {showAudioMenu && (
                    <div className={styles.dropdownMenu}>
                      <p className={styles.menuLabel}>Audio</p>
                      {audioTracks.map((track) => (
                        <button
                          key={track.id}
                          className={`${styles.menuItem} ${currentAudio === track.id ? styles.menuItemActive : ''}`}
                          onClick={() => handleAudioChange(track.id)}
                          data-focusable="true"
                        >
                          {track.name}
                          <span className={styles.trackLang}>{track.lang}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles selector */}
              <div className={styles.menuWrapper}>
                <button
                  className={`${styles.textBtn} ${currentSubtitle >= 0 ? styles.textBtnActive : ''}`}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setShowSubtitlesMenu(!showSubtitlesMenu); 
                    setShowSpeedMenu(false); 
                    setShowAudioMenu(false);
                    setShowSubtitleSettings(false);
                  }}
                  aria-label="Subtítulos"
                  data-focusable="true"
                  data-testid="subtitle-selector"
                  data-active={currentSubtitle >= 0 ? 'true' : 'false'}
                >
                  <Subtitles size={18} data-testid="toggle-subtitles" />
                  <span>CC</span>
                  <ChevronDown size={16} />
                </button>
                {showSubtitlesMenu && (
                  <div className={styles.dropdownMenu}>
                    <p className={styles.menuLabel}>Subtítulos</p>
                    <button
                      className={`${styles.menuItem} ${currentSubtitle === -1 ? styles.menuItemActive : ''}`}
                      onClick={() => handleSubtitleChange(-1)}
                      data-focusable="true"
                    >
                      Desactivados
                    </button>
                    {subtitleTracks.map((track) => (
                      <button
                        key={track.id}
                        className={`${styles.menuItem} ${currentSubtitle === track.id ? styles.menuItemActive : ''}`}
                        onClick={() => handleSubtitleChange(track.id)}
                        data-focusable="true"
                      >
                        {track.name}
                        <span className={styles.trackLang}>{track.lang}</span>
                      </button>
                    ))}
                    <div className={styles.menuDivider} />
                    <button 
                      className={styles.menuItemSettings}
                      onClick={(e) => { e.stopPropagation(); setShowSubtitleSettings(true); setShowSubtitlesMenu(false); }}
                      data-focusable="true"
                    >
                      <Settings size={14} /> Ajustes visuales
                    </button>
                  </div>
                )}

                {/* Subtitle Visual Settings */}
                {showSubtitleSettings && (
                  <div className={styles.dropdownMenu} style={{ minWidth: '220px' }}>
                    <p className={styles.menuLabel}>Ajustes de Subtítulos</p>
                    
                    <div className={styles.settingSection}>
                      <span className={styles.settingTitle}>Tamaño</span>
                      <div className={styles.settingOptions}>
                        {(['small', 'normal', 'large'] as const).map(size => (
                          <button 
                            key={size}
                            className={`${styles.settingBtn} ${subtitleSettings.fontSize === size ? styles.settingBtnActive : ''}`}
                            onClick={(e) => { e.stopPropagation(); setSubtitleSettings({...subtitleSettings, fontSize: size})}}
                            data-focusable="true"
                          >
                            {size === 'small' ? 'Peque' : size === 'normal' ? 'Norm' : 'Gran'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.settingSection}>
                      <span className={styles.settingTitle}>Color</span>
                      <div className={styles.settingOptions}>
                        {(['white', 'yellow', 'cyan'] as const).map(color => (
                          <button 
                            key={color}
                            className={`${styles.settingBtn} ${subtitleSettings.color === color ? styles.settingBtnActive : ''}`}
                            onClick={(e) => { e.stopPropagation(); setSubtitleSettings({...subtitleSettings, color})}}
                            data-focusable="true"
                          >
                            <div className={styles.colorCircle} style={{ backgroundColor: color }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.settingSection}>
                      <span className={styles.settingTitle}>Fondo</span>
                      <div className={styles.settingOptions}>
                        {(['none', 'shadow', 'solid'] as const).map(bg => (
                          <button 
                            key={bg}
                            className={`${styles.settingBtn} ${subtitleSettings.background === bg ? styles.settingBtnActive : ''}`}
                            onClick={(e) => { e.stopPropagation(); setSubtitleSettings({...subtitleSettings, background: bg})}}
                            data-focusable="true"
                          >
                            {bg === 'none' ? 'Sin' : bg === 'shadow' ? 'Somb' : 'Fondo'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      className={styles.menuItemBack}
                      onClick={(e) => { e.stopPropagation(); setShowSubtitleSettings(false); setShowSubtitlesMenu(true); }}
                      data-focusable="true"
                    >
                      ← Volver
                    </button>
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              {canPiP && (
                <button className={styles.iconBtn} onClick={togglePiP} aria-label={isPiP ? 'Salir de PiP' : 'Modo PiP'} data-focusable="true">
                  <PictureInPicture size={22} color={isPiP ? '#007AFF' : 'white'} />
                </button>
              )}
              {/* Fullscreen */}
              <button className={styles.iconBtn} onClick={handleToggleFullscreen} aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} data-focusable="true">
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
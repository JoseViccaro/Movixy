import { useState, useRef, useCallback } from "react";
import type { GestureHUDState, GestureType } from "@/domain/models/gesture.model";

export interface UsePlayerGesturesOptions {
  onVolumeChange?: (volume: number) => void;
  onBrightnessChange?: (brightness: number) => void;
  onSeek?: (deltaSeconds: number) => void;
  initialVolume?: number;
  initialBrightness?: number;
  currentTime?: number;
  duration?: number;
}

export function usePlayerGestures({
  onVolumeChange,
  onBrightnessChange,
  onSeek,
  initialVolume = 1,
  initialBrightness = 1,
  currentTime = 0,
  duration: _duration = 0,
}: UsePlayerGesturesOptions = {}) {
  const [hudState, setHudState] = useState<GestureHUDState>({
    type: "none",
    value: 0,
    isVisible: false,
  });

  const [brightness, setBrightness] = useState(initialBrightness);
  const [volume, setVolume] = useState(initialVolume);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeGestureRef = useRef<GestureType>("none");
  const initialGestureValRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHUD = useCallback((state: Partial<GestureHUDState>) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHudState((prev) => ({
      ...prev,
      ...state,
      isVisible: true,
    }));
    hideTimerRef.current = setTimeout(() => {
      setHudState((prev) => ({ ...prev, isVisible: false, type: "none" }));
    }, 1200);
  }, []);

  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest("button, input, [data-focusable='true'], .controls");
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isInteractiveElement(e.target) || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const now = Date.now();

      // Check double tap
      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time;
        const distDiff = Math.hypot(
          touch.clientX - lastTapRef.current.x,
          touch.clientY - lastTapRef.current.y
        );

        if (timeDiff < 300 && distDiff < 50) {
          const screenWidth = window.innerWidth || document.documentElement.clientWidth || 1000;
          const ratio = touch.clientX / screenWidth;

          if (ratio < 0.35) {
            // Double tap left -> -10s
            onSeek?.(-10);
            showHUD({ type: "double-tap-left", value: -10, icon: "backward", label: "-10s" });
            lastTapRef.current = null;
            return;
          } else if (ratio > 0.65) {
            // Double tap right -> +10s
            onSeek?.(10);
            showHUD({ type: "double-tap-right", value: 10, icon: "forward", label: "+10s" });
            lastTapRef.current = null;
            return;
          }
        }
      }

      lastTapRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      activeGestureRef.current = "none";
    },
    [onSeek, showHUD]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const screenWidth = window.innerWidth || document.documentElement.clientWidth || 1000;
      const screenHeight = window.innerHeight || document.documentElement.clientHeight || 800;

      // Lock gesture type once threshold passed
      if (activeGestureRef.current === "none") {
        if (absX > 20 && absX > absY) {
          activeGestureRef.current = "scrub";
          initialGestureValRef.current = currentTime;
        } else if (absY > 20 && absY > absX) {
          const isLeft = touchStartRef.current.x < screenWidth / 2;
          if (isLeft) {
            activeGestureRef.current = "brightness";
            initialGestureValRef.current = brightness;
          } else {
            activeGestureRef.current = "volume";
            initialGestureValRef.current = volume;
          }
        }
      }

      if (activeGestureRef.current === "brightness") {
        const deltaRatio = -deltaY / (screenHeight * 0.7);
        const newBrightness = Math.max(0.1, Math.min(1.5, initialGestureValRef.current + deltaRatio));
        setBrightness(newBrightness);
        onBrightnessChange?.(newBrightness);
        showHUD({
          type: "brightness",
          value: Math.round(newBrightness * 100),
          icon: "brightness",
          label: `${Math.round(newBrightness * 100)}%`,
        });
      } else if (activeGestureRef.current === "volume") {
        const deltaRatio = -deltaY / (screenHeight * 0.7);
        const newVolume = Math.max(0, Math.min(1, initialGestureValRef.current + deltaRatio));
        setVolume(newVolume);
        onVolumeChange?.(newVolume);
        showHUD({
          type: "volume",
          value: Math.round(newVolume * 100),
          icon: "volume",
          label: `${Math.round(newVolume * 100)}%`,
        });
      } else if (activeGestureRef.current === "scrub") {
        const scrubDeltaSec = Math.round((deltaX / screenWidth) * 90);
        showHUD({
          type: "scrub",
          value: scrubDeltaSec,
          icon: scrubDeltaSec >= 0 ? "forward" : "backward",
          label: `${scrubDeltaSec > 0 ? "+" : ""}${scrubDeltaSec}s`,
        });
      }
    },
    [brightness, volume, currentTime, onBrightnessChange, onVolumeChange, showHUD]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (activeGestureRef.current === "scrub" && touchStartRef.current && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || 1000;
        const scrubDeltaSec = Math.round((deltaX / screenWidth) * 90);
        if (Math.abs(scrubDeltaSec) > 1) {
          onSeek?.(scrubDeltaSec);
        }
      }
      touchStartRef.current = null;
      activeGestureRef.current = "none";
    },
    [onSeek]
  );

  return {
    hudState,
    brightness,
    volume,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setBrightness,
    setVolume,
  };
}

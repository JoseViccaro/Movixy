import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayerGestures } from "./usePlayerGestures";

describe("usePlayerGestures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const onVolumeChange = vi.fn();
    const onBrightnessChange = vi.fn();
    const onSeek = vi.fn();

    const { result } = renderHook(() =>
      usePlayerGestures({
        onVolumeChange,
        onBrightnessChange,
        onSeek,
        initialVolume: 1,
        initialBrightness: 1,
      })
    );

    expect(result.current.hudState.isVisible).toBe(false);
    expect(result.current.hudState.type).toBe("none");
    expect(result.current.brightness).toBe(1);
  });

  it("should handle double tap on left zone for rewind (-10s)", () => {
    const onSeek = vi.fn();
    const { result } = renderHook(() =>
      usePlayerGestures({
        onSeek,
        duration: 100,
        currentTime: 50,
      })
    );

    const mockTarget = document.createElement("div");

    // Double tap on left side (< 30% of screen width 1000)
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 300 }],
        target: mockTarget,
      } as any);
      result.current.handleTouchEnd({
        changedTouches: [{ clientX: 100, clientY: 300 }],
        target: mockTarget,
      } as any);
    });

    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 105, clientY: 305 }],
        target: mockTarget,
      } as any);
      result.current.handleTouchEnd({
        changedTouches: [{ clientX: 105, clientY: 305 }],
        target: mockTarget,
      } as any);
    });

    expect(onSeek).toHaveBeenCalledWith(-10);
  });

  it("should handle double tap on right zone for fast forward (+10s)", () => {
    const onSeek = vi.fn();
    const { result } = renderHook(() =>
      usePlayerGestures({
        onSeek,
        duration: 100,
        currentTime: 50,
      })
    );

    const mockTarget = document.createElement("div");
    // Window width mock 1000px, tap at 800px (> 70%)
    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true, configurable: true });

    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 850, clientY: 300 }],
        target: mockTarget,
      } as any);
      result.current.handleTouchEnd({
        changedTouches: [{ clientX: 850, clientY: 300 }],
        target: mockTarget,
      } as any);
    });

    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 855, clientY: 305 }],
        target: mockTarget,
      } as any);
      result.current.handleTouchEnd({
        changedTouches: [{ clientX: 855, clientY: 305 }],
        target: mockTarget,
      } as any);
    });

    expect(onSeek).toHaveBeenCalledWith(10);
  });
});

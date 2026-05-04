import { useEffect, useCallback, useRef } from 'react';

/**
 * D-pad / TV Remote Navigation Hook
 * 
 * Manages spatial navigation for TV remotes and keyboard arrow keys.
 * Elements with `data-focusable="true"` become navigable.
 * The currently focused element gets the `[data-focused="true"]` attribute.
 * 
 * Key mappings (standard Android TV remote):
 * - ArrowUp/Down/Left/Right → spatial navigation
 * - Enter / Space → activate (click)
 * - Backspace / Escape → go back
 * - MediaPlayPause → play/pause toggle
 */

interface UseDpadOptions {
  /** CSS selector for focusable container (defaults to document) */
  containerSelector?: string;
  /** Called when Back/Escape is pressed */
  onBack?: () => void;
  /** Enable/disable the hook */
  enabled?: boolean;
  /** Selector for the initial element to focus */
  initialFocusSelector?: string;
}

// Focusable selector
const FOCUSABLE_SELECTOR = '[data-focusable="true"]';

function getDistance(
  rect1: DOMRect,
  rect2: DOMRect,
  direction: 'up' | 'down' | 'left' | 'right'
): number {
  const cx1 = rect1.left + rect1.width / 2;
  const cy1 = rect1.top + rect1.height / 2;
  const cx2 = rect2.left + rect2.width / 2;
  const cy2 = rect2.top + rect2.height / 2;

  // Check if candidate is in the correct direction
  switch (direction) {
    case 'up':
      if (cy2 >= cy1) return Infinity;
      break;
    case 'down':
      if (cy2 <= cy1) return Infinity;
      break;
    case 'left':
      if (cx2 >= cx1) return Infinity;
      break;
    case 'right':
      if (cx2 <= cx1) return Infinity;
      break;
  }

  // Weighted distance: primary axis is weighted more heavily
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;

  if (direction === 'up' || direction === 'down') {
    return Math.abs(dy) + Math.abs(dx) * 3;
  }
  return Math.abs(dx) + Math.abs(dy) * 3;
}

function findNearest(
  current: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right',
  container: Element | Document
): HTMLElement | null {
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => el !== current && el.offsetParent !== null);

  if (focusables.length === 0) return null;

  const currentRect = current.getBoundingClientRect();
  let nearest: HTMLElement | null = null;
  let minDistance = Infinity;

  for (const el of focusables) {
    const rect = el.getBoundingClientRect();
    const dist = getDistance(currentRect, rect, direction);

    if (dist < minDistance) {
      minDistance = dist;
      nearest = el;
    }
  }

  return nearest;
}

export function useDpadNavigation(options: UseDpadOptions = {}) {
  const {
    containerSelector,
    onBack,
    enabled = true,
    initialFocusSelector,
  } = options;

  const focusedRef = useRef<HTMLElement | null>(null);

  const setFocused = useCallback((el: HTMLElement | null) => {
    // Remove focus from previous
    if (focusedRef.current) {
      focusedRef.current.removeAttribute('data-focused');
      focusedRef.current.classList.remove('dpad-focused');
    }

    if (el) {
      el.setAttribute('data-focused', 'true');
      el.classList.add('dpad-focused');
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      el.focus({ preventScroll: true });
      focusedRef.current = el;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const container = containerSelector
        ? document.querySelector(containerSelector)
        : document;

      if (!container) return;

      // If no element is focused, focus the first one
      if (!focusedRef.current || !document.body.contains(focusedRef.current)) {
        const first = container.querySelector<HTMLElement>(
          initialFocusSelector || FOCUSABLE_SELECTOR
        );
        if (first) setFocused(first);
        return;
      }

      const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      const direction = directionMap[e.key];

      if (direction) {
        e.preventDefault();
        const next = findNearest(focusedRef.current, direction, container);
        if (next) setFocused(next);
        return;
      }

      // Enter / Space → click
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focusedRef.current.click();
        return;
      }

      // Back button (TV remote sends Backspace, browser sends Escape)
      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        onBack?.();
        return;
      }
    },
    [enabled, containerSelector, initialFocusSelector, onBack, setFocused]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Set initial focus
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      const container = containerSelector
        ? document.querySelector(containerSelector)
        : document;

      if (!container) return;

      const initial = container.querySelector<HTMLElement>(
        initialFocusSelector || FOCUSABLE_SELECTOR
      );
      if (initial) setFocused(initial);
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled, containerSelector, initialFocusSelector, setFocused]);

  return {
    setFocused,
    currentFocused: focusedRef,
  };
}

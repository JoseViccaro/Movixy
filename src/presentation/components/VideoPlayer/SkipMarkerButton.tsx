import React, { useCallback } from 'react';
import { FastForward } from 'lucide-react';
import type { ActiveSkipMarkerState } from '@/domain/models/chapter-marker.model';
import styles from './SkipMarkerButton.module.css';

interface SkipMarkerButtonProps {
  state: ActiveSkipMarkerState;
  onSkip: (targetTime: number) => void;
  onDismiss?: () => void;
}

export const SkipMarkerButton = ({
  state,
  onSkip,
}: SkipMarkerButtonProps) => {
  const { isVisible, label, targetTimeSeconds } = state;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSkip(targetTimeSeconds);
    },
    [onSkip, targetTimeSeconds]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onSkip(targetTimeSeconds);
      }
    },
    [onSkip, targetTimeSeconds]
  );

  if (!isVisible) return null;

  return (
    <div className={styles.skipContainer} data-testid="skip-marker-container">
      <button
        className={styles.skipBtn}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-focusable="true"
        aria-label={label}
      >
        <FastForward className={styles.icon} />
        <span>{label}</span>
      </button>
    </div>
  );
};

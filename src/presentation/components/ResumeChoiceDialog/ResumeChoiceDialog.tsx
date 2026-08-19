import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';
import type { ResumeEligibility } from '@/domain/models/resume-playback.model';
import styles from './ResumeChoiceDialog.module.css';

interface ResumeChoiceDialogProps {
  isOpen: boolean;
  title: string;
  eligibility: ResumeEligibility | null;
  onResume: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const ResumeChoiceDialog: React.FC<ResumeChoiceDialogProps> = ({
  isOpen,
  title,
  eligibility,
  onResume,
  onRestart,
  onClose,
}) => {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      resumeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !eligibility) {
    return null;
  }

  const progressPercent = Math.min(100, Math.max(0, eligibility.progressPercentage));

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="resume-dialog-title" className={styles.dialogTitle}>
            Continuar viendo
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
            data-focusable="true"
          >
            <X size={20} />
          </button>
        </div>

        <p className={styles.mediaTitle}>{title}</p>

        <div className={styles.progressSection}>
          <div
            className={styles.progressBarContainer}
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.timeInfo}>
            <span>En {eligibility.formattedPosition}</span>
            {eligibility.runtimeSeconds > 0 && (
              <span>de {eligibility.formattedRuntime}</span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            ref={resumeButtonRef}
            className={styles.primaryButton}
            onClick={onResume}
            data-focusable="true"
          >
            <Play size={18} fill="currentColor" />
            <span>Reanudar ({eligibility.formattedPosition})</span>
          </button>

          <button
            className={styles.secondaryButton}
            onClick={onRestart}
            data-focusable="true"
          >
            <RotateCcw size={18} />
            <span>Comenzar desde el inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

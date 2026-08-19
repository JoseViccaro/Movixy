import React, { useEffect, useRef } from 'react';
import {
  UpdateStatus,
  type ReleaseInfo,
  type UpdateProgress,
} from '@domain/models/app-update.model';
import { Sparkles, Download, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './UpdateAvailableModal.module.css';

export interface UpdateAvailableModalProps {
  isOpen: boolean;
  status: UpdateStatus;
  currentVersion: string;
  release: ReleaseInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  isOpen,
  status,
  currentVersion,
  release,
  progress,
  error,
  onUpdate,
  onDismiss,
}) => {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary button when modal opens (TV & D-Pad navigation friendly)
    const timeout = setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen || !release) {
    return null;
  }

  const isDownloading = status === UpdateStatus.DOWNLOADING;
  const isError = status === UpdateStatus.ERROR;
  const percentage = progress?.percentage ?? 0;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            {isError ? <AlertCircle size={24} /> : <Sparkles size={24} />}
          </div>
          <div className={styles.headerContent}>
            <h2 id="update-title" className={styles.title}>
              {isError ? 'Error al actualizar' : '¡Nueva versión disponible!'}
            </h2>
            <div className={styles.versionBadgeContainer}>
              <span className={styles.currentVersion}>v{currentVersion || '1.0.0'}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.newVersion}>v{release.version}</span>
            </div>
          </div>
        </div>

        {release.body && !isDownloading && !isError && (
          <div className={styles.body}>
            {release.body}
          </div>
        )}

        {isDownloading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span>Descargando actualización...</span>
              <span>{percentage}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {isError && error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}

        <div className={styles.actions}>
          {!isDownloading && (
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onDismiss}
              data-focusable="true"
            >
              Más tarde
            </button>
          )}

          <button
            ref={primaryButtonRef}
            type="button"
            className={styles.buttonPrimary}
            onClick={onUpdate}
            disabled={isDownloading}
            data-focusable="true"
          >
            {isDownloading ? (
              <>
                <RefreshCw size={18} className="animate-spin" style={{ marginRight: 8 }} />
                Descargando...
              </>
            ) : isError ? (
              <>
                <RefreshCw size={18} style={{ marginRight: 8 }} />
                Reintentar
              </>
            ) : (
              <>
                <Download size={18} style={{ marginRight: 8 }} />
                Actualizar ahora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

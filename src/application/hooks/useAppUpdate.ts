import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UpdateStatus,
  type ReleaseInfo,
  type UpdateProgress,
} from '@domain/models/app-update.model';
import { AppUpdateService } from '@application/services/AppUpdateService';
import { AppUpdateRepositoryImpl } from '@data/repositories/AppUpdateRepositoryImpl';

export interface UseAppUpdateOptions {
  service?: AppUpdateService;
  autoCheck?: boolean;
  checkDelayMs?: number;
  owner?: string;
  repo?: string;
}

export interface UseAppUpdateReturn {
  status: UpdateStatus;
  isModalOpen: boolean;
  currentVersion: string;
  latestRelease: ReleaseInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  checkForUpdate: () => Promise<void>;
  startUpdate: () => Promise<void>;
  dismissModal: () => void;
  openModal: () => void;
}

export function useAppUpdate(options: UseAppUpdateOptions = {}): UseAppUpdateReturn {
  const {
    service: customService,
    autoCheck = true,
    checkDelayMs = 3000,
    owner = 'JoseViccaro',
    repo = 'Movixy',
  } = options;

  const serviceRef = useRef<AppUpdateService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current =
      customService ||
      new AppUpdateService(new AppUpdateRepositoryImpl(), { owner, repo });
  } else if (customService && serviceRef.current !== customService) {
    serviceRef.current = customService;
  }

  const [status, setStatus] = useState<UpdateStatus>(UpdateStatus.IDLE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDismissedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (!serviceRef.current) return;
    setStatus(UpdateStatus.CHECKING);
    setError(null);

    try {
      const result = await serviceRef.current.checkForUpdate();
      setCurrentVersion(result.currentVersion);
      setLatestRelease(result.latestRelease);

      if (result.hasUpdate && result.latestRelease) {
        setStatus(UpdateStatus.UPDATE_AVAILABLE);
        if (!isDismissedRef.current) {
          setIsModalOpen(true);
        }
      } else {
        setStatus(UpdateStatus.UP_TO_DATE);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error checking for updates';
      setError(message);
      setStatus(UpdateStatus.ERROR);
    }
  }, []);

  const startUpdate = useCallback(async () => {
    if (!serviceRef.current || !latestRelease) return;

    setStatus(UpdateStatus.DOWNLOADING);
    setError(null);
    setProgress({ receivedBytes: 0, totalBytes: 100, percentage: 0 });

    try {
      await serviceRef.current.performUpdate(latestRelease, (prog) => {
        setProgress(prog);
      });
      setStatus(UpdateStatus.READY_TO_INSTALL);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error performing update';
      setError(message);
      setStatus(UpdateStatus.ERROR);
    }
  }, [latestRelease]);

  const dismissModal = useCallback(() => {
    isDismissedRef.current = true;
    setIsModalOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!autoCheck) return;

    const timer = setTimeout(() => {
      checkForUpdate();
    }, checkDelayMs);

    return () => clearTimeout(timer);
  }, [autoCheck, checkDelayMs, checkForUpdate]);

  return {
    status,
    isModalOpen,
    currentVersion,
    latestRelease,
    progress,
    error,
    checkForUpdate,
    startUpdate,
    dismissModal,
    openModal,
  };
}

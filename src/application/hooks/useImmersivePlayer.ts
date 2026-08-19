import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ISystemUIController } from '@/domain/repositories/ISystemUIController';
import type { SystemUIConfig, SystemUIState } from '@/domain/models/system-ui.model';
import { ImmersiveModeService } from '@/application/services/ImmersiveModeService';
import { CapacitorSystemUIControllerImpl } from '@/data/repositories/CapacitorSystemUIControllerImpl';

export interface UseImmersivePlayerOptions {
  autoEnterOnMount?: boolean;
  config?: SystemUIConfig;
  controller?: ISystemUIController;
  targetElement?: HTMLElement | null;
}

export function useImmersivePlayer(options: UseImmersivePlayerOptions = {}) {
  const {
    autoEnterOnMount = true,
    config,
    controller,
    targetElement,
  } = options;

  const controllerInstance = useMemo<ISystemUIController>(
    () => controller || new CapacitorSystemUIControllerImpl(),
    [controller]
  );

  const service = useMemo<ImmersiveModeService>(
    () => new ImmersiveModeService(controllerInstance),
    [controllerInstance]
  );

  const [state, setState] = useState<SystemUIState>(() => service.getState());
  const [isImmersive, setIsImmersive] = useState<boolean>(() => service.isImmersiveActive());

  const enter = useCallback(
    async (overrideConfig?: SystemUIConfig, element?: HTMLElement) => {
      const target = element ?? (targetElement || undefined);
      const newState = await service.enterImmersiveMode(
        { ...config, ...overrideConfig },
        target
      );
      setState(newState);
      setIsImmersive(true);
    },
    [service, config, targetElement]
  );

  const exit = useCallback(async () => {
    const newState = await service.exitImmersiveMode();
    setState(newState);
    setIsImmersive(false);
  }, [service]);

  const toggle = useCallback(
    async (overrideConfig?: SystemUIConfig, element?: HTMLElement) => {
      if (isImmersive) {
        await exit();
      } else {
        await enter(overrideConfig, element);
      }
    },
    [isImmersive, enter, exit]
  );

  const configRef = useRef(config);
  configRef.current = config;
  const targetElementRef = useRef(targetElement);
  targetElementRef.current = targetElement;

  useEffect(() => {
    let isMounted = true;

    if (autoEnterOnMount) {
      service.enterImmersiveMode(configRef.current, targetElementRef.current || undefined).then((newState) => {
        if (isMounted) {
          setState(newState);
          setIsImmersive(true);
        }
      });
    }

    return () => {
      isMounted = false;
      if (service.isImmersiveActive()) {
        service.exitImmersiveMode();
      }
      service.dispose();
    };
  }, [service, autoEnterOnMount]);

  return {
    state,
    isImmersive,
    enter,
    exit,
    toggle,
    controller: controllerInstance,
  };
}

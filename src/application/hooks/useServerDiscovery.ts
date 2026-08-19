import { useState, useEffect, useCallback, useMemo } from "react";
import type { DiscoveredServer, IServerDiscoveryRepository } from "@/domain/models/discovery.model";
import { ServerDiscoveryRepositoryImpl } from "@/data/repositories/server-discovery.repository";

export interface UseServerDiscoveryOptions {
  repository?: IServerDiscoveryRepository;
  autoScan?: boolean;
}

export function useServerDiscovery(options?: UseServerDiscoveryOptions) {
  const repo = useMemo(() => options?.repository ?? new ServerDiscoveryRepositoryImpl(), [options?.repository]);
  const autoScan = options?.autoScan ?? false;

  const [servers, setServers] = useState<DiscoveredServer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    try {
      const saved = await repo.getSavedServers();
      setServers(saved);
    } catch {
      // Ignore
    }
  }, [repo]);

  const scan = useCallback(async (subnets?: string[]) => {
    setIsScanning(true);
    setError(null);
    try {
      const discovered = await repo.discoverLocalServers(subnets);
      setServers(discovered);
      for (const s of discovered) {
        await repo.saveServer(s);
      }
      return discovered;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error scanning network");
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [repo]);

  useEffect(() => {
    loadSaved();
    if (autoScan) {
      scan();
    }
  }, [autoScan, loadSaved, scan]);

  return {
    servers,
    isScanning,
    error,
    scan,
    refresh: loadSaved,
  };
}

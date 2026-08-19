import type {
  IServerDiscoveryRepository,
  ServerConnectionConfig,
  ServerEndpointPingResult,
} from "@/domain/models/discovery.model";

export class ServerConnectionService {
  private readonly repository: IServerDiscoveryRepository;
  private readonly configKey = "movixy_connection_config";

  constructor(repository: IServerDiscoveryRepository) {
    this.repository = repository;
  }

  async resolveActiveEndpoint(config: ServerConnectionConfig): Promise<ServerEndpointPingResult> {
    if (config.autoFallback && config.lanUrl && config.wanUrl) {
      const raceResult = await this.repository.raceDualUrls(
        config.lanUrl,
        config.wanUrl,
        config.lanTimeoutMs
      );
      if (raceResult.isReachable) {
        this.saveConfig({
          ...config,
          activeUrl: raceResult.url,
          lastConnectedAt: Date.now(),
        });
        return raceResult;
      }
    }

    const pingResult = await this.repository.pingEndpoint(config.activeUrl);
    if (pingResult.isReachable) {
      this.saveConfig({
        ...config,
        lastConnectedAt: Date.now(),
      });
    }
    return pingResult;
  }

  getSavedConfig(): ServerConnectionConfig | null {
    try {
      const raw = localStorage.getItem(this.configKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveConfig(config: ServerConnectionConfig): void {
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }
}

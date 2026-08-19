import type {
  DiscoveredServer,
  IServerDiscoveryRepository,
  ServerEndpointPingResult,
} from "@/domain/models/discovery.model";
import { SubnetProber } from "@/data/sources/SubnetProber";

export class ServerDiscoveryRepositoryImpl implements IServerDiscoveryRepository {
  private readonly prober: SubnetProber;
  private readonly storageKey = "movixy_discovered_servers";

  constructor(prober?: SubnetProber) {
    this.prober = prober ?? new SubnetProber();
  }

  async discoverLocalServers(subnets?: string[], timeoutMs = 1500): Promise<DiscoveredServer[]> {
    const targets = this.prober.generateSubnetCandidates(subnets);
    const results = await this.prober.probeTargets(targets, timeoutMs);

    return results
      .filter((r) => r.isReachable && r.serverId)
      .map((r) => ({
        id: r.serverId!,
        name: r.serverName || "Jellyfin Server",
        url: r.url,
        lanUrl: r.url,
        latencyMs: r.latencyMs,
        source: "lan-sweep",
        lastSeen: Date.now(),
        isReachable: true,
        version: r.version,
      }));
  }

  async pingEndpoint(url: string, timeoutMs?: number): Promise<ServerEndpointPingResult> {
    return this.prober.probeEndpoint(url, timeoutMs);
  }

  async raceDualUrls(
    lanUrl: string,
    wanUrl: string,
    lanTimeoutMs = 2000
  ): Promise<ServerEndpointPingResult> {
    const lanPromise = this.pingEndpoint(lanUrl, lanTimeoutMs);
    const wanPromise = this.pingEndpoint(wanUrl, 5000);

    const lanResult = await lanPromise;
    if (lanResult.isReachable) {
      return lanResult;
    }

    const wanResult = await wanPromise;
    if (wanResult.isReachable) {
      return wanResult;
    }

    return lanResult.error ? lanResult : wanResult;
  }

  async getSavedServers(): Promise<DiscoveredServer[]> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveServer(server: DiscoveredServer): Promise<void> {
    const list = await this.getSavedServers();
    const filtered = list.filter((s) => s.id !== server.id);
    filtered.unshift(server);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  async removeSavedServer(serverId: string): Promise<void> {
    const list = await this.getSavedServers();
    const filtered = list.filter((s) => s.id !== serverId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }
}

import type { ServerEndpointPingResult } from "@/domain/models/discovery.model";

export interface SubnetProberOptions {
  concurrencyLimit?: number;
  defaultTimeoutMs?: number;
  defaultPort?: number;
}

export class SubnetProber {
  private readonly concurrencyLimit: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultPort: number;

  constructor(options?: SubnetProberOptions) {
    this.concurrencyLimit = options?.concurrencyLimit ?? 10;
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 1500;
    this.defaultPort = options?.defaultPort ?? 8096;
  }

  async probeEndpoint(url: string, timeoutMs = this.defaultTimeoutMs): Promise<ServerEndpointPingResult> {
    const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    const pingUrl = cleanUrl + "/System/Info/Public";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = performance.now();

    try {
      const response = await fetch(pingUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);

      if (!response.ok) {
        return {
          url: cleanUrl,
          latencyMs,
          isReachable: false,
          error: "HTTP " + response.status,
        };
      }

      const data = await response.json();
      return {
        url: cleanUrl,
        latencyMs,
        isReachable: true,
        serverId: data.Id || data.id,
        serverName: data.ServerName || data.serverName,
        version: data.Version || data.version,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);
      return {
        url: cleanUrl,
        latencyMs,
        isReachable: false,
        error: err instanceof Error ? err.message : "Unknown network error",
      };
    }
  }

  generateSubnetCandidates(subnetPrefixes: string[] = ["192.168.1.", "192.168.0.", "10.0.0."]): string[] {
    const urls: string[] = [];
    for (const prefix of subnetPrefixes) {
      for (let i = 1; i <= 254; i++) {
        urls.push("http://" + prefix + i + ":" + this.defaultPort);
      }
    }
    return urls;
  }

  async probeTargets(targets: string[], timeoutMs = this.defaultTimeoutMs): Promise<ServerEndpointPingResult[]> {
    const results: ServerEndpointPingResult[] = [];
    const queue = [...targets];

    const workers = Array.from({ length: Math.min(this.concurrencyLimit, queue.length) }).map(async () => {
      while (queue.length > 0) {
        const target = queue.shift();
        if (!target) break;
        const res = await this.probeEndpoint(target, timeoutMs);
        if (res.isReachable) {
          results.push(res);
        }
      }
    });

    await Promise.all(workers);
    return results;
  }
}

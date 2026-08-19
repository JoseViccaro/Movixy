export interface DiscoveredServer {
  id: string;
  name: string;
  url: string;
  lanUrl?: string;
  wanUrl?: string;
  latencyMs: number;
  source: "lan-sweep" | "local-storage" | "manual" | "tailscale";
  lastSeen: number;
  isReachable: boolean;
  version?: string;
}

export interface ServerEndpointPingResult {
  url: string;
  latencyMs: number;
  isReachable: boolean;
  serverName?: string;
  serverId?: string;
  version?: string;
  error?: string;
}

export interface ServerConnectionConfig {
  activeUrl: string;
  lanUrl?: string;
  wanUrl?: string;
  autoFallback: boolean;
  preferredRoute: "lan" | "wan" | "auto";
  lanTimeoutMs: number;
  lastConnectedAt?: number;
}

export interface IServerDiscoveryRepository {
  discoverLocalServers(subnets?: string[], timeoutMs?: number): Promise<DiscoveredServer[]>;
  pingEndpoint(url: string, timeoutMs?: number): Promise<ServerEndpointPingResult>;
  raceDualUrls(lanUrl: string, wanUrl: string, lanTimeoutMs?: number): Promise<ServerEndpointPingResult>;
  getSavedServers(): Promise<DiscoveredServer[]>;
  saveServer(server: DiscoveredServer): Promise<void>;
  removeSavedServer(serverId: string): Promise<void>;
}

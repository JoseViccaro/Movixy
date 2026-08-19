import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerConnectionService } from "./server-connection.service";
import type { IServerDiscoveryRepository } from "@/domain/models/discovery.model";

describe("ServerConnectionService", () => {
  let mockRepo: any;
  let service: ServerConnectionService;

  beforeEach(() => {
    mockRepo = {
      pingEndpoint: vi.fn(),
      raceDualUrls: vi.fn(),
      getSavedServers: vi.fn().mockResolvedValue([]),
      saveServer: vi.fn(),
      removeSavedServer: vi.fn(),
      discoverLocalServers: vi.fn(),
    };
    service = new ServerConnectionService(mockRepo as IServerDiscoveryRepository);
    localStorage.clear();
  });

  it("should connect using activeUrl if valid", async () => {
    mockRepo.pingEndpoint.mockResolvedValue({
      url: "http://192.168.1.50:8096",
      isReachable: true,
      latencyMs: 12,
      serverId: "srv-1",
      serverName: "HomeServer",
    });

    const result = await service.resolveActiveEndpoint({
      activeUrl: "http://192.168.1.50:8096",
      autoFallback: true,
      preferredRoute: "auto",
      lanTimeoutMs: 2000,
    });

    expect(result.url).toBe("http://192.168.1.50:8096");
    expect(result.isReachable).toBe(true);
  });

  it("should trigger dual URL race when both LAN and WAN URLs exist and autoFallback is enabled", async () => {
    mockRepo.raceDualUrls.mockResolvedValue({
      url: "https://tailscale.jellyfin.net",
      isReachable: true,
      latencyMs: 45,
      serverId: "srv-1",
    });

    const result = await service.resolveActiveEndpoint({
      activeUrl: "http://192.168.1.50:8096",
      lanUrl: "http://192.168.1.50:8096",
      wanUrl: "https://tailscale.jellyfin.net",
      autoFallback: true,
      preferredRoute: "auto",
      lanTimeoutMs: 2000,
    });

    expect(mockRepo.raceDualUrls).toHaveBeenCalledWith(
      "http://192.168.1.50:8096",
      "https://tailscale.jellyfin.net",
      2000
    );
    expect(result.url).toBe("https://tailscale.jellyfin.net");
  });
});

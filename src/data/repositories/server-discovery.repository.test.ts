import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerDiscoveryRepositoryImpl } from "./server-discovery.repository";
import type { SubnetProber } from "@/data/sources/SubnetProber";

describe("ServerDiscoveryRepositoryImpl", () => {
  let mockProber: any;
  let repo: ServerDiscoveryRepositoryImpl;

  beforeEach(() => {
    mockProber = {
      probeEndpoint: vi.fn(),
      generateSubnetCandidates: vi.fn().mockReturnValue(["http://192.168.1.50:8096"]),
      probeTargets: vi.fn(),
    };
    repo = new ServerDiscoveryRepositoryImpl(mockProber as SubnetProber);
    localStorage.clear();
  });

  it("should ping an endpoint and return ping result", async () => {
    mockProber.probeEndpoint.mockResolvedValue({
      url: "http://192.168.1.50:8096",
      latencyMs: 15,
      isReachable: true,
      serverId: "srv-1",
      serverName: "MediaServer",
    });

    const res = await repo.pingEndpoint("http://192.168.1.50:8096");
    expect(res.isReachable).toBe(true);
    expect(res.serverName).toBe("MediaServer");
  });

  it("should race dual URLs preferring LAN if both respond within threshold", async () => {
    mockProber.probeEndpoint.mockImplementation((url: string) => {
      if (url.includes("192.168")) {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                url,
                latencyMs: 30,
                isReachable: true,
                serverId: "srv-1",
              }),
            30
          )
        );
      } else {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                url,
                latencyMs: 15, // WAN is slightly faster or equal
                isReachable: true,
                serverId: "srv-1",
              }),
            15
          )
        );
      }
    });

    const winner = await repo.raceDualUrls("http://192.168.1.50:8096", "https://jellyfin.example.com", 2000);
    // Even if WAN responds slightly earlier, within lanTimeoutMs we prefer LAN!
    expect(winner.url).toBe("http://192.168.1.50:8096");
  });

  it("should fallback to WAN if LAN times out or fails", async () => {
    mockProber.probeEndpoint.mockImplementation((url: string) => {
      if (url.includes("192.168")) {
        return Promise.resolve({
          url,
          latencyMs: 2500,
          isReachable: false,
          error: "Timeout",
        });
      } else {
        return Promise.resolve({
          url,
          latencyMs: 80,
          isReachable: true,
          serverId: "srv-1",
        });
      }
    });

    const winner = await repo.raceDualUrls("http://192.168.1.50:8096", "https://jellyfin.example.com", 500);
    expect(winner.url).toBe("https://jellyfin.example.com");
    expect(winner.isReachable).toBe(true);
  });

  it("should save and retrieve discovered servers from storage", async () => {
    const server = {
      id: "srv-1",
      name: "My Server",
      url: "http://192.168.1.50:8096",
      latencyMs: 20,
      source: "lan-sweep" as const,
      lastSeen: Date.now(),
      isReachable: true,
    };

    await repo.saveServer(server);
    const saved = await repo.getSavedServers();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("My Server");

    await repo.removeSavedServer("srv-1");
    const afterDelete = await repo.getSavedServers();
    expect(afterDelete).toHaveLength(0);
  });
});

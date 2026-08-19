import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServerDiscovery } from "./useServerDiscovery";
import type { IServerDiscoveryRepository } from "@/domain/models/discovery.model";

describe("useServerDiscovery", () => {
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      discoverLocalServers: vi.fn().mockResolvedValue([
        {
          id: "srv-1",
          name: "Local Jellyfin",
          url: "http://192.168.1.100:8096",
          latencyMs: 10,
          isReachable: true,
          source: "lan-sweep",
          lastSeen: Date.now(),
        },
      ]),
      getSavedServers: vi.fn().mockResolvedValue([]),
      saveServer: vi.fn(),
      removeSavedServer: vi.fn(),
      pingEndpoint: vi.fn(),
      raceDualUrls: vi.fn(),
    };
  });

  it("should trigger scan and return discovered servers", async () => {
    const { result } = renderHook(() => useServerDiscovery({ repository: mockRepo as IServerDiscoveryRepository, autoScan: false }));

    expect(result.current.isScanning).toBe(false);
    expect(result.current.servers).toEqual([]);

    await act(async () => {
      await result.current.scan();
    });

    expect(result.current.servers).toHaveLength(1);
    expect(result.current.servers[0].name).toBe("Local Jellyfin");
  });
});

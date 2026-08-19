import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubnetProber } from "./SubnetProber";

describe("SubnetProber", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should probe an IP and return server info when Jellyfin responds", async () => {
    const prober = new SubnetProber();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("192.168.1.50:8096")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                ServerName: "HomeServer",
                Id: "srv-123",
                Version: "10.9.11",
              }),
          });
        }
        return Promise.reject(new Error("Network timeout"));
      })
    );

    const result = await prober.probeEndpoint("http://192.168.1.50:8096", 500);

    expect(result.isReachable).toBe(true);
    expect(result.serverId).toBe("srv-123");
    expect(result.serverName).toBe("HomeServer");
    expect(result.version).toBe("10.9.11");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should return unreachable when probe times out or rejects", async () => {
    const prober = new SubnetProber();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("AbortError")));

    const result = await prober.probeEndpoint("http://192.168.1.99:8096", 100);

    expect(result.isReachable).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should probe subnets with bounded concurrency and find active servers", async () => {
    const prober = new SubnetProber({ concurrencyLimit: 5 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === "http://192.168.1.10:8096/System/Info/Public") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                ServerName: "Server10",
                Id: "id-10",
                Version: "10.9.0",
              }),
          });
        }
        return Promise.reject(new Error("Not found"));
      })
    );

    const candidates = ["http://192.168.1.1:8096", "http://192.168.1.10:8096", "http://192.168.1.20:8096"];
    const results = await prober.probeTargets(candidates, 300);

    expect(results).toHaveLength(1);
    expect(results[0].serverId).toBe("id-10");
    expect(results[0].serverName).toBe("Server10");
  });

  it("should generate common local candidate IPs", () => {
    const prober = new SubnetProber();
    const candidates = prober.generateSubnetCandidates(["192.168.1."]);
    expect(candidates.length).toBeGreaterThan(10);
    expect(candidates).toContain("http://192.168.1.1:8096");
    expect(candidates).toContain("http://192.168.1.100:8096");
  });
});

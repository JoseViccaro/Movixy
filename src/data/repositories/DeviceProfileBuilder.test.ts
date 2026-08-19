import { describe, it, expect } from "vitest";
import { DeviceProfileBuilder } from "./DeviceProfileBuilder";
import type { ClientMediaCapabilities } from "@/domain/models/media-profile.model";

describe("DeviceProfileBuilder", () => {
  const defaultCaps: ClientMediaCapabilities = {
    supportsH264: true,
    supportsHevc: true,
    supportsAv1: false,
    supportsVp9: true,
    supportsAac: true,
    supportsOpus: true,
    supportsFlac: true,
    supportsAc3: false,
    supportsEac3: false,
    maxVideoWidth: 3840,
    maxVideoHeight: 2160,
    supportsHdr: false,
  };

  it("should build a valid Jellyfin DeviceProfile JSON structure", () => {
    const builder = new DeviceProfileBuilder();
    const profile = builder.buildProfile(defaultCaps);

    expect(profile.Name).toBe("Movixy Dynamic Web Client");
    expect(profile.MaxStreamingBitrate).toBeGreaterThan(0);
    expect(profile.DirectPlayProfiles).toBeDefined();
    expect(profile.TranscodingProfiles).toBeDefined();
    expect(profile.CodecProfiles).toBeDefined();
  });

  it("should include HEVC direct play profile only when supported", () => {
    const builder = new DeviceProfileBuilder();
    const profileWithHevc = builder.buildProfile(defaultCaps);
    const hasHevc = profileWithHevc.DirectPlayProfiles.some(
      (p) => p.VideoCodec?.includes("hevc") || p.VideoCodec?.includes("h265")
    );
    expect(hasHevc).toBe(true);

    const profileWithoutHevc = builder.buildProfile({ ...defaultCaps, supportsHevc: false });
    const hasHevc2 = profileWithoutHevc.DirectPlayProfiles.some(
      (p) => p.VideoCodec?.includes("hevc") || p.VideoCodec?.includes("h265")
    );
    expect(hasHevc2).toBe(false);
  });

  it("should generate HLS transcode fallback profiles for web playback", () => {
    const builder = new DeviceProfileBuilder();
    const profile = builder.buildProfile(defaultCaps);

    const hlsProfile = profile.TranscodingProfiles.find((p) => p.Protocol === "hls");
    expect(hlsProfile).toBeDefined();
    expect(hlsProfile?.VideoCodec).toBe("h264");
    expect(hlsProfile?.AudioCodec).toContain("aac");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaybackEngineService } from "./playback-engine.service";
import type { MediaCapabilitiesProfiler } from "@/data/sources/MediaCapabilitiesProfiler";
import type { DeviceProfileBuilder } from "@/data/repositories/DeviceProfileBuilder";

describe("PlaybackEngineService", () => {
  let mockProfiler: any;
  let mockBuilder: any;
  let mockApiClient: any;
  let engine: PlaybackEngineService;

  beforeEach(() => {
    mockProfiler = {
      getCapabilities: vi.fn().mockResolvedValue({
        supportsH264: true,
        supportsHevc: true,
        supportsAac: true,
      }),
    };
    mockBuilder = {
      buildProfile: vi.fn().mockReturnValue({
        Name: "Test Profile",
        DirectPlayProfiles: [{ Container: "mp4", Type: "Video", VideoCodec: "h264,hevc", AudioCodec: "aac" }],
      }),
    };
    mockApiClient = {
      baseUrl: "http://192.168.1.50:8096",
      getPlaybackInfo: vi.fn(),
      getStreamUrl: vi.fn().mockReturnValue("http://192.168.1.50:8096/Videos/123/stream.mp4?static=true"),
    };

    engine = new PlaybackEngineService(
      mockProfiler as MediaCapabilitiesProfiler,
      mockBuilder as DeviceProfileBuilder,
      mockApiClient
    );
  });

  it("should select Direct Play when media source supports direct play and no transcoding is forced", async () => {
    mockApiClient.getPlaybackInfo.mockResolvedValue({
      MediaSources: [
        {
          Id: "source-1",
          Container: "mp4",
          SupportsDirectPlay: true,
          SupportsDirectStream: true,
          SupportsTranscoding: true,
          MediaStreams: [
            { Type: "Video", Codec: "h264" },
            { Type: "Audio", Codec: "aac" },
          ],
        },
      ],
    });

    const plan = await engine.resolveStreamPlan("123", "user-1");

    expect(plan.deliveryMethod).toBe("DirectPlay");
    expect(plan.supportsDirectPlay).toBe(true);
    expect(plan.streamUrl).toContain("static=true");
  });

  it("should select Transcoding when Jellyfin provides a TranscodingUrl", async () => {
    mockApiClient.getPlaybackInfo.mockResolvedValue({
      MediaSources: [
        {
          Id: "source-2",
          Container: "mkv",
          SupportsDirectPlay: false,
          SupportsDirectStream: false,
          SupportsTranscoding: true,
          TranscodingUrl: "/Videos/123/master.m3u8?params=1",
          MediaStreams: [
            { Type: "Video", Codec: "vc1" },
            { Type: "Audio", Codec: "dts" },
          ],
        },
      ],
    });

    const plan = await engine.resolveStreamPlan("123", "user-1");

    expect(plan.deliveryMethod).toBe("Transcode");
    expect(plan.streamUrl).toContain("master.m3u8");
  });
});

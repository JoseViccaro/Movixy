import type {
  IPlaybackEngineService,
  PlaybackStreamPlan,
} from "@/domain/models/media-profile.model";
import { MediaCapabilitiesProfiler } from "@/data/sources/MediaCapabilitiesProfiler";
import { DeviceProfileBuilder } from "@/data/repositories/DeviceProfileBuilder";
import { JellyfinApiClient } from "@/data/sources/jellyfin-api.client";

export class PlaybackEngineService implements IPlaybackEngineService {
  private readonly profiler: MediaCapabilitiesProfiler;
  private readonly profileBuilder: DeviceProfileBuilder;
  private readonly apiClient: JellyfinApiClient;

  constructor(
    profiler?: MediaCapabilitiesProfiler,
    profileBuilder?: DeviceProfileBuilder,
    apiClient?: JellyfinApiClient
  ) {
    this.profiler = profiler ?? new MediaCapabilitiesProfiler();
    this.profileBuilder = profileBuilder ?? new DeviceProfileBuilder();
    this.apiClient = apiClient ?? new JellyfinApiClient();
  }

  async resolveStreamPlan(
    mediaId: string,
    userId: string,
    _mediaSource?: unknown,
    startPositionSeconds?: number
  ): Promise<PlaybackStreamPlan> {
    const caps = await this.profiler.getCapabilities();
    const deviceProfile = this.profileBuilder.buildProfile(caps);

    const cleanMediaId = mediaId.replace(/-/g, "");
    const playbackInfo = await this.apiClient.getPlaybackInfo(userId, cleanMediaId, {
      DeviceProfile: deviceProfile,
      MaxStreamingBitrate: deviceProfile.MaxStreamingBitrate,
      StartTimeTicks: startPositionSeconds ? Math.floor(startPositionSeconds * 10_000_000) : undefined,
    });

    const source = playbackInfo?.MediaSources?.[0];
    if (!source) {
      throw new Error("No media sources found for playback.");
    }

    const videoStream = source.MediaStreams?.find((s: any) => s.Type === "Video");
    const audioStream = source.MediaStreams?.find((s: any) => s.Type === "Audio");

    const videoCodec = videoStream?.Codec || "h264";
    const audioCodec = audioStream?.Codec || "aac";
    const container = source.Container || "mp4";

    const base = this.apiClient.baseUrl.replace(/\/$/, "");
    const directPlayUrl = `${base}/Videos/${cleanMediaId}/stream.${container}?static=true`;

    if (source.SupportsDirectPlay && !source.TranscodingUrl) {
      return {
        deliveryMethod: "DirectPlay",
        streamUrl: directPlayUrl,
        directPlayUrl,
        videoCodec,
        audioCodec,
        container,
        supportsDirectPlay: true,
        startPositionTicks: startPositionSeconds ? Math.floor(startPositionSeconds * 10_000_000) : undefined,
      };
    }

    if (source.TranscodingUrl) {
      const transcodingPath = source.TranscodingUrl.startsWith("/")
        ? source.TranscodingUrl
        : `/${source.TranscodingUrl}`;
      const url = source.TranscodingUrl.startsWith("http")
        ? source.TranscodingUrl
        : `${base}${transcodingPath}`;

      return {
        deliveryMethod: source.SupportsDirectStream ? "DirectStream" : "Transcode",
        streamUrl: url.replace(/\/videos\//i, "/Videos/").replace("?&", "?"),
        transcodingUrl: url,
        directPlayUrl,
        videoCodec,
        audioCodec,
        container,
        supportsDirectPlay: false,
        startPositionTicks: startPositionSeconds ? Math.floor(startPositionSeconds * 10_000_000) : undefined,
      };
    }

    return {
      deliveryMethod: "DirectPlay",
      streamUrl: directPlayUrl,
      directPlayUrl,
      videoCodec,
      audioCodec,
      container,
      supportsDirectPlay: true,
      startPositionTicks: startPositionSeconds ? Math.floor(startPositionSeconds * 10_000_000) : undefined,
    };
  }
}

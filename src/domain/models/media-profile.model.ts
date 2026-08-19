export interface ClientMediaCapabilities {
  supportsHevc: boolean;
  supportsAv1: boolean;
  supportsVp9: boolean;
  supportsH264: boolean;
  supportsAac: boolean;
  supportsOpus: boolean;
  supportsFlac: boolean;
  supportsAc3: boolean;
  supportsEac3: boolean;
  maxVideoWidth: number;
  maxVideoHeight: number;
  supportsHdr: boolean;
}

export type PlaybackDeliveryMethod = "DirectPlay" | "DirectStream" | "Transcode";

export interface PlaybackStreamPlan {
  deliveryMethod: PlaybackDeliveryMethod;
  streamUrl: string;
  transcodingUrl?: string;
  directPlayUrl?: string;
  videoCodec: string;
  audioCodec: string;
  container: string;
  bitrate?: number;
  startPositionTicks?: number;
  supportsDirectPlay: boolean;
}

export interface JellyfinDeviceProfile {
  Name: string;
  MaxStreamingBitrate: number;
  MaxStaticBitrate: number;
  MusicStreamingTranscodingBitrate: number;
  DirectPlayProfiles: Array<{
    Container: string;
    Type: "Video" | "Audio";
    VideoCodec?: string;
    AudioCodec?: string;
  }>;
  CodecProfiles: Array<{
    Type: "Video" | "Audio";
    Codec: string;
    Conditions: Array<{
      Condition: string;
      Property: string;
      Value: string;
      IsRequired: boolean;
    }>;
  }>;
  TranscodingProfiles: Array<{
    Container: string;
    Type: "Video" | "Audio";
    VideoCodec: string;
    AudioCodec: string;
    Protocol: string;
    EstimateContentLength?: boolean;
    EnableMpegtsM2TsMode?: boolean;
    TranscodeSeekInfo?: string;
    CopyTimestamps?: boolean;
    Context?: string;
    MaxAudioChannels?: string;
    MinSegments?: number;
    SegmentLength?: number;
  }>;
}

export interface IMediaProfileService {
  getCapabilities(): Promise<ClientMediaCapabilities>;
  buildDeviceProfile(caps: ClientMediaCapabilities): JellyfinDeviceProfile;
}

export interface IPlaybackEngineService {
  resolveStreamPlan(
    mediaId: string,
    userId: string,
    mediaSource?: unknown,
    startPositionSeconds?: number
  ): Promise<PlaybackStreamPlan>;
}

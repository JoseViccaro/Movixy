import type {
  ClientMediaCapabilities,
  JellyfinDeviceProfile,
} from "@/domain/models/media-profile.model";

export class DeviceProfileBuilder {
  buildProfile(caps: ClientMediaCapabilities): JellyfinDeviceProfile {
    const directVideoCodecs: string[] = [];
    if (caps.supportsH264) directVideoCodecs.push("h264", "avc");
    if (caps.supportsHevc) directVideoCodecs.push("hevc", "h265");
    if (caps.supportsAv1) directVideoCodecs.push("av1", "av01");
    if (caps.supportsVp9) directVideoCodecs.push("vp9");

    const directAudioCodecs: string[] = [];
    if (caps.supportsAac) directAudioCodecs.push("aac", "mp4a.40.2");
    if (caps.supportsOpus) directAudioCodecs.push("opus");
    if (caps.supportsFlac) directAudioCodecs.push("flac");
    if (caps.supportsAc3) directAudioCodecs.push("ac3");
    if (caps.supportsEac3) directAudioCodecs.push("eac3");
    directAudioCodecs.push("mp3");

    const directPlayProfiles: JellyfinDeviceProfile["DirectPlayProfiles"] = [
      {
        Container: "mp4,m4v,mov",
        Type: "Video",
        VideoCodec: directVideoCodecs.join(","),
        AudioCodec: directAudioCodecs.join(","),
      },
      {
        Container: "webm",
        Type: "Video",
        VideoCodec: caps.supportsVp9 || caps.supportsAv1 ? (caps.supportsAv1 ? "av1,vp9" : "vp9") : "vp8",
        AudioCodec: "opus,vorbis",
      },
      {
        Container: "mp3,aac,flac,wav,m4a",
        Type: "Audio",
      },
    ];

    if (caps.supportsHevc || caps.supportsH264) {
      directPlayProfiles.push({
        Container: "mkv",
        Type: "Video",
        VideoCodec: directVideoCodecs.join(","),
        AudioCodec: directAudioCodecs.join(","),
      });
    }

    const transcodingProfiles: JellyfinDeviceProfile["TranscodingProfiles"] = [
      {
        Container: "ts",
        Type: "Video",
        VideoCodec: "h264",
        AudioCodec: "aac,mp3",
        Protocol: "hls",
        Context: "Streaming",
        EstimateContentLength: false,
        EnableMpegtsM2TsMode: false,
        TranscodeSeekInfo: "Auto",
        CopyTimestamps: false,
        MaxAudioChannels: "6",
        MinSegments: 1,
        SegmentLength: 3,
      },
      {
        Container: "mp3",
        Type: "Audio",
        VideoCodec: "",
        AudioCodec: "mp3",
        Protocol: "http",
        Context: "Streaming",
      },
    ];

    const codecProfiles: JellyfinDeviceProfile["CodecProfiles"] = [
      {
        Type: "Video",
        Codec: "h264",
        Conditions: [
          {
            Condition: "LessThanEqual",
            Property: "Width",
            Value: String(caps.maxVideoWidth),
            IsRequired: false,
          },
          {
            Condition: "LessThanEqual",
            Property: "Height",
            Value: String(caps.maxVideoHeight),
            IsRequired: false,
          },
          {
            Condition: "LessThanEqual",
            Property: "VideoBitrate",
            Value: "80000000",
            IsRequired: false,
          },
        ],
      },
    ];

    return {
      Name: "Movixy Dynamic Web Client",
      MaxStreamingBitrate: 80000000,
      MaxStaticBitrate: 80000000,
      MusicStreamingTranscodingBitrate: 320000,
      DirectPlayProfiles: directPlayProfiles,
      CodecProfiles: codecProfiles,
      TranscodingProfiles: transcodingProfiles,
    };
  }
}

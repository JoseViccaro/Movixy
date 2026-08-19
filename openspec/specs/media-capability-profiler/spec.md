# Specification: media-capability-profiler

## Scope & Purpose
Defines the functional and technical requirements for dynamic runtime profiling of host device media capabilities (browser engine & Capacitor native layer) using `HTMLMediaElement.canPlayType`, `navigator.mediaCapabilities.decodingInfo`, and WebCodecs. It builds an optimized Jellyfin `DeviceProfile` payload to maximize Direct Play and Direct Stream utilization while avoiding unneeded server-side transcoding.

---

## Requirements

### Requirement 1: Runtime Device Codec Support Matrix Detection
The system SHALL dynamically query the host platform at runtime to identify supported video codecs, audio codecs, and container formats.

#### Scenario 1.1: Modern browser with HEVC and AV1 support
- **Given** a client browser/device supporting H.264 (AVC), H.265 (HEVC), AV1, VP9, and audio codecs AAC, Opus, FLAC, AC3/EAC3
- **When** `MediaCapabilityProfiler` inspects decoding capabilities via `navigator.mediaCapabilities.decodingInfo` and `canPlayType`
- **Then** the profiler SHALL produce a `ClientMediaCapabilities` record containing:
  - Video codecs: `['h264', 'hevc', 'av1', 'vp9']`
  - Audio codecs: `['aac', 'opus', 'flac', 'mp3', 'eac3', 'ac3']`
  - Containers: `['mp4', 'm4v', 'mkv', 'webm', 'ts']`
  - Max resolution: `3840x2160` (or detected display hardware max)
  - HDR formats: detected support for `HDR10` or `Dolby Vision` where applicable.

#### Scenario 1.2: Legacy or limited browser fallback
- **Given** an environment without `navigator.mediaCapabilities` API
- **When** capability detection runs
- **Then** the system SHALL fall back to `HTMLMediaElement.canPlayType` testing MIME types (e.g. `'video/mp4; codecs="avc1.640028"'`, `'video/webm; codecs="vp9"'`)
- **And** produce a safe baseline capabilities profile without throwing runtime exceptions.

---

### Requirement 2: Dynamic Jellyfin DeviceProfile Construction
The system SHALL transform detected runtime capabilities into a valid Jellyfin `DeviceProfile` schema.

#### Scenario 2.1: Direct Play profile prioritization
- **Given** a detected `ClientMediaCapabilities` matrix
- **When** `DeviceProfileBuilder.build(capabilities)` is executed
- **Then** the resulting `DeviceProfile` SHALL include:
  - `DirectPlayProfiles` mapped for all natively supported container + codec combinations (e.g. MKV/MP4 with HEVC/H.264 + AAC/Opus)
  - `TranscodingProfiles` configured with `Protocol: "hls"`, `Container: "ts"|"mp4"`, `VideoCodec: "h264"`, `AudioCodec: "aac"` as fallback only
  - `CodecProfiles` specifying max width, height, and bitrate constraints matching the client screen and network configuration.

#### Scenario 2.2: Negotiation with Jellyfin PlaybackInfo
- **Given** a media item with specific audio/video streams
- **When** `MediaPlaybackService` requests `/Items/{id}/PlaybackInfo` with the dynamic `DeviceProfile`
- **Then** Jellyfin server SHALL evaluate `SupportsDirectPlay` and `SupportsDirectStream` based on actual client capabilities
- **And** if `SupportsDirectPlay` is true, the service SHALL construct a direct stream URL bypassing transcoding.

---

### Requirement 3: Playback Mode Resolution Rules
The system SHALL classify stream delivery into Direct Play, Direct Stream (container remux / audio transcode only), or Full Transcode according to strict resolution rules.

#### Scenario 3.1: Direct Play mode selection
- **Given** media whose video codec, audio codec, and container match client capabilities directly
- **When** playback URL is resolved
- **Then** `MediaPlaybackService` SHALL return a Direct Play URL (`/Videos/{id}/stream.{container}?static=true`)
- **And** playback telemetry SHALL record `playMethod = 'DirectPlay'`.

#### Scenario 3.2: Direct Stream mode selection (Video copy, Audio transcode)
- **Given** media whose video codec (e.g. HEVC 4K) is supported natively, but audio codec (e.g. TrueHD 7.1) is unsupported
- **When** playback URL is resolved
- **Then** the system SHALL instruct Jellyfin to copy video stream (`VideoCodec=copy`) and transcode only audio (`AudioCodec=aac`) into HLS/fMP4
- **And** prevent full CPU/GPU video re-encoding on the server.

#### Scenario 3.3: Playback error graceful fallback to HLS Transcode
- **Given** a direct stream playback fails with a fatal video element error (`MEDIA_ERR_DECODE` or `MEDIA_ERR_SRC_NOT_SUPPORTED`)
- **When** player error handler intercepts the failure
- **Then** the player SHALL automatically re-request playback with explicit HLS Transcode forced
- **And** resume playback at the last known timestamp.

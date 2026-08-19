# Proposal: Zero-Friction Connection and Playback

## Intent

Eliminate connection friction on local/remote networks and deliver a native, high-performance streaming experience by introducing auto-discovery, dual-URL switching, dynamic media capability profiling (Direct Play prioritization), and VLC/Infuse-grade touch gestures.

## Scope

### In Scope
- **Connectivity & Discovery**: Subnet/mDNS/SSDP server discovery probe, dual-URL (LAN vs. WAN/Tailscale) health ping fallback, server picker sheet on login.
- **Intelligent Media Profiling**: Browser & Capacitor codec detection (`canPlayType`, MediaCapabilities API, WebCodecs), Jellyfin playback profile negotiation (Direct Play/Direct Stream vs. HLS transcode).
- **Player UX & Gesture Engine**: Vertical swipe for brightness (left) & volume (right), double-tap to seek (10s), horizontal drag to scrub, with clean visual overlays.

### Out of Scope
- Server-side hardware transcoding tuning (NVENC/VAAPI).
- Background audio/video pip mode enhancements.
- Chromecast/AirPlay remote casting protocol integration.

## Capabilities

### New Capabilities
- `server-autodiscovery`: Local subnet scanning and SSDP/mDNS broadcast receiver for automatic Jellyfin host resolution.
- `media-capability-profiler`: Dynamic device codec & container analyzer building tailored Jellyfin `DeviceProfile` payloads.
- `player-gesture-engine`: Multi-touch gesture recognition for brightness, volume, seek, and scrub overlays in video player.

### Modified Capabilities
- `connection-manager`: Support primary (LAN) and fallback (WAN/Tailscale) endpoints with background latency/liveness racing.
- `video-player`: Stream source selection dynamically chooses direct stream/container remux over static 8Mbps HLS transcode.

## Approach

1. **Discovery & Dual-URL**: Implement an async network prober testing common LAN ports, local mDNS/SSDP, and configured WAN URLs. Automatically connect to lowest-latency reachable endpoint.
2. **Client Profiling**: Replace hardcoded transcode parameters with a runtime capability matrix via `navigator.mediaCapabilities.decodingInfo` to unlock native 4K/HEVC/AV1/HDR direct playback.
3. **Touch Gestures**: Attach pointer/touch event recognizers to the player canvas managing normalized deltas for HUD controls without DOM re-render lag.

## Affected Areas

| Area | Impact | Description |
|------|--------|------------|
| `src/services/discovery/` | New | Server auto-discovery & network ping service |
| `src/services/playback/` | Modified | Dynamic `DeviceProfile` builder & codec capability detector |
| `src/components/Player/` | Modified | Gesture engine & HUD overlay integration |
| `src/views/Login.vue` | Modified | Server picker & auto-detected host chips |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Web sandbox blocks raw UDP broadcast | High | Fall back to rapid HTTP subnet range sweep on Web/PWA; native plugin on Capacitor. |
| Inaccurate codec support report | Med | Graceful fallback to HLS transcode on video playback error event. |

## Rollback Plan

Revert to static server URL input in Login and fallback to legacy 8Mbps HLS Jellyfin transcode profile via Git revert of the feature branch. Effort: < 15 minutes.

## Success Criteria

- [ ] Local Jellyfin server discovered and listed in Login in < 3s without manual IP entry.
- [ ] Direct Play automatically selected for supported MP4/MKV/HEVC/H.264 streams.
- [ ] Touch gestures (brightness, volume, 10s seek, scrub) operate smoothly at 60fps on mobile.

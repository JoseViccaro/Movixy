# Technical Design: Zero-Friction Connection and Playback

## 1. Overview & Architecture Goals

This technical design outlines the implementation for `zero-friction-connection-and-playback`.
The core objectives are:
1. **Zero-Configuration Server Setup**: Instant server discovery on LAN/Wi-Fi via SSDP/mDNS and rapid subnet sweeps, alongside dual-URL latency racing (LAN vs. WAN/Tailscale) with fallback.
2. **Direct Play Media Maximization**: Device media capability detection (`MediaCapabilities`, `canPlayType`) to dynamically craft Jellyfin `DeviceProfile` structures, replacing fixed 8Mbps HLS transcodes with Direct Play and Direct Stream (audio transcode only / container remux).
3. **VLC/Infuse-Grade Gesture Engine**: High-performance touch and pointer gesture recognition for brightness (left vertical swipe), volume (right vertical swipe), double-tap seek (10s), and horizontal scrub with instantaneous HUD overlays.

---

## 2. Clean Architecture Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           @presentation Layer                           │
│  - ServerPickerSheet.tsx, ServerChip.tsx                                │
│  - usePlayerGestures.ts (Touch gesture HUD state & handlers)            │
│  - VideoPlayer.tsx (Updated with Direct Play engine & Gesture HUDs)     │
│  - Login.tsx (Updated with server auto-discovery chips)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                           @application Layer                            │
│  - ServerConnectionService.ts (Dual-URL latency race & liveness)        │
│  - PlaybackEngineService.ts (Stream URL & Direct Play negotiation)      │
│  - useServerDiscovery.ts (React Query hook for server scan)             │
├─────────────────────────────────────────────────────────────────────────┤
│                              @domain Layer                              │
│  - Models: DiscoveredServer, ServerEndpoint, ClientMediaCapabilities,   │
│            GestureState, PlaybackStreamPlan                             │
│  - Repository & Service Contracts:                                      │
│      * IServerDiscoveryRepository                                       │
│      * IMediaProfileService                                             │
│      * IPlaybackEngineService                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                               @data Layer                               │
│  - SubnetProber.ts (Concurrent bounded HTTP scan)                       │
│  - DeviceProfileBuilder.ts (Jellyfin DeviceProfile JSON builder)        │
│  - ServerDiscoveryRepositoryImpl.ts                                     │
│  - MediaCapabilitiesProfiler.ts (W3C MediaCapabilities API wrapper)     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Interface Contracts & Domain Definitions

### 3.1 `@domain/models/discovery.model.ts`
```typescript
export interface DiscoveredServer {
  id: string;
  name: string;
  lanUrl: string;
  wanUrl?: string;
  activeUrl: string;
  latencyMs: number;
  version?: string;
  lastSeen: number;
}

export interface ServerEndpointPingResult {
  url: string;
  reachable: boolean;
  latencyMs: number;
  serverInfo?: {
    id: string;
    name: string;
    version: string;
  };
}

export interface IServerDiscoveryRepository {
  discoverLocalServers(timeoutMs?: number): Promise<DiscoveredServer[]>;
  pingEndpoint(url: string, timeoutMs?: number): Promise<ServerEndpointPingResult>;
  raceDualUrls(primaryUrl: string, fallbackUrl?: string): Promise<string>;
}
```

### 3.2 `@domain/models/media-profile.model.ts`
```typescript
export interface ClientMediaCapabilities {
  videoCodecs: string[];       // ['h264', 'hevc', 'av1', 'vp9']
  audioCodecs: string[];       // ['aac', 'mp3', 'opus', 'flac', 'eac3', 'ac3']
  containers: string[];        // ['mp4', 'm4v', 'mkv', 'webm', 'ts']
  maxResolution: { width: number; height: number };
  supportsHdr: boolean;
  supportsDirectPlay: boolean;
}

export type PlaybackDeliveryMethod = 'DirectPlay' | 'DirectStream' | 'Transcode';

export interface PlaybackStreamPlan {
  deliveryMethod: PlaybackDeliveryMethod;
  streamUrl: string;
  container: string;
  videoCodec: string;
  audioCodec: string;
  playSessionId: string;
  startPositionSeconds?: number;
}

export interface IMediaProfileService {
  getDeviceCapabilities(): Promise<ClientMediaCapabilities>;
  buildJellyfinDeviceProfile(capabilities: ClientMediaCapabilities): Record<string, unknown>;
}
```

### 3.3 `@domain/models/gesture.model.ts`
```typescript
export type GestureType = 'none' | 'brightness' | 'volume' | 'seek' | 'scrub';

export interface GestureHUDState {
  type: GestureType;
  value: number; // Percentage (0..100) or Seek seconds delta
  visible: boolean;
  formattedText?: string;
}

export interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}
```

---

## 4. Implementation Details by Layer

### 4.1 `@data/sources/SubnetProber.ts` & `@data/repositories/ServerDiscoveryRepositoryImpl.ts`
- **Subnet Sweep Engine**: Uses `CapacitorHttp` (or browser `fetch` with `AbortController` and 1500ms timeout) to scan candidate subnets (`192.168.1.1..254`, `192.168.0.1..254`, `10.0.0.1..254`, `localhost:8096`).
- **Ping & Latency Race**: `Promise.any` / `Promise.allSettled` to ping `/System/Info/Public` or `/System/Ping`. If LAN responds under 2000ms, it is chosen. If LAN fails or times out, fallback (WAN / Tailscale) is chosen automatically.

### 4.2 `@data/sources/MediaCapabilitiesProfiler.ts` & `@data/repositories/DeviceProfileBuilder.ts`
- **Capability Detection**: Uses `navigator.mediaCapabilities.decodingInfo` queries with fallback to `video.canPlayType()`.
- **Dynamic Device Profile**: Builds `DirectPlayProfiles` for MKV, MP4, WebM containing detected native codecs (HEVC Main 10, AV1, H264, Opus, AAC).
- **Direct Play Prioritization**: Instead of always building `.m3u8` URLs, `PlaybackEngineService` inspects the media source. If `SupportsDirectPlay` is true and container is supported, returns `/Videos/{id}/stream.{container}?static=true` with the active session token.

### 4.3 `@presentation/hooks/usePlayerGestures.ts`
- Listens to `pointerdown`, `pointermove`, `pointerup`, `pointercancel` on the player container.
- Splits screen horizontally:
  - Left 40%: Vertical drag adjusts brightness (stored in local player state, rendered via CSS brightness filter on `<video>`).
  - Right 40%: Vertical drag adjusts `<video>.volume`.
  - Center 20%: Tap triggers control toggle.
  - Double-tap on left half triggers seek -10s; double-tap on right half triggers seek +10s.
  - Horizontal drag (>15px threshold) initiates scrub mode showing target timestamp in a centered floating HUD.

---

## 5. File Changes Table

| File Path | Layer | Action | Description |
|-----------|-------|--------|-------------|
| `src/domain/models/discovery.model.ts` | `@domain` | Create | Interfaces for server discovery, ping results, and discovery repository contract |
| `src/domain/models/media-profile.model.ts` | `@domain` | Create | Interfaces for media capabilities, playback delivery method, and device profiles |
| `src/domain/models/gesture.model.ts` | `@domain` | Create | Interfaces and types for player gestures and HUD state |
| `src/data/sources/SubnetProber.ts` | `@data` | Create | Network prober for subnet sweep and public endpoint ping |
| `src/data/sources/MediaCapabilitiesProfiler.ts` | `@data` | Create | Runtime media capabilities profiler using MediaCapabilities & canPlayType |
| `src/data/repositories/DeviceProfileBuilder.ts` | `@data` | Create | Jellyfin DeviceProfile JSON structure builder matching client capabilities |
| `src/data/repositories/server-discovery.repository.ts` | `@data` | Create | Implementation of `IServerDiscoveryRepository` |
| `src/application/services/server-connection.service.ts` | `@application` | Create | Manages dual-URL resolution, background latency racing, and server persistence |
| `src/application/services/playback-engine.service.ts` | `@application` | Create | Resolves Direct Play vs Direct Stream vs Transcode with dynamic DeviceProfile |
| `src/application/hooks/useServerDiscovery.ts` | `@application` | Create | React Query hook for triggering and caching server discovery |
| `src/presentation/components/ServerPicker/ServerPickerSheet.tsx` | `@presentation` | Create | Bottom sheet / chip list component for discovered and saved servers |
| `src/presentation/components/ServerPicker/ServerPickerSheet.module.css` | `@presentation` | Create | CSS module for server chips with status badges and TV focus styling |
| `src/presentation/hooks/usePlayerGestures.ts` | `@presentation` | Create | Custom hook for handling touch swipes, double-taps, scrubbing, and HUD states |
| `src/presentation/components/VideoPlayer/GestureHUD.tsx` | `@presentation` | Create | OSD overlay displaying brightness, volume, and scrub indicators |
| `src/presentation/components/VideoPlayer/GestureHUD.module.css` | `@presentation` | Create | High-visibility styling for gesture overlays at 60fps |
| `src/presentation/components/Login/Login.tsx` | `@presentation` | Modify | Integrate `ServerPickerSheet` and discovered server quick-chips |
| `src/presentation/components/VideoPlayer/VideoPlayer.tsx` | `@presentation` | Modify | Integrate `usePlayerGestures`, `GestureHUD`, and Direct Play fallback |
| `src/application/services/media-playback.service.ts` | `@application` | Modify | Delegate profile building and stream resolution to `PlaybackEngineService` |

---

## 6. Strict TDD Testing Strategy

All new units will be developed following Strict Test-Driven Development (Red-Green-Refactor) with **Vitest** and **React Testing Library**.

### 6.1 Data & Domain Unit Tests
- `SubnetProber.test.ts`:
  - Verify scanning handles reachable and unreachable IPs without hanging.
  - Verify timeout cancellation with `AbortController`.
- `MediaCapabilitiesProfiler.test.ts`:
  - Mock `navigator.mediaCapabilities.decodingInfo` returning true for HEVC/AV1.
  - Mock fallback to `HTMLMediaElement.canPlayType` when API is absent.
- `DeviceProfileBuilder.test.ts`:
  - Verify generated JSON conforms to Jellyfin `DeviceProfile` schema with correct `DirectPlayProfiles`.

### 6.2 Application Layer Tests
- `server-connection.service.test.ts`:
  - Verify LAN URL is preferred when faster than WAN URL.
  - Verify WAN fallback is selected when LAN URL ping throws or exceeds timeout.
- `playback-engine.service.test.ts`:
  - Verify Direct Play URL is generated when `SupportsDirectPlay` is true.
  - Verify Direct Stream / HLS fallback when Direct Play is unsupported.

### 6.3 Presentation & Hook Component Tests
- `usePlayerGestures.test.ts`:
  - Simulate vertical swipe on left side -> triggers brightness HUD and updates brightness.
  - Simulate vertical swipe on right side -> updates volume and triggers volume HUD.
  - Simulate double tap (<300ms) on right half -> seeks +10s; left half -> seeks -10s.
  - Simulate horizontal drag -> triggers scrub HUD with target timestamp.
- `ServerPickerSheet.test.tsx`:
  - Render list of discovered servers as focusable chips.
  - Clicking a chip selects the URL and calls callback.

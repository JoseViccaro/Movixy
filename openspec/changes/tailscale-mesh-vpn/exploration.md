# Exploration: Tailscale Mesh VPN for Movixy

## Current State

### How Remote Access Works Today

**Jellyfin Server** (on laptop via Docker):
- Runs Jellyfin on `:8096` via `docker-compose.yml`
- Has a **cloudflared tunnel** sidecar container (ephemeral mode — `tunnel --url http://jellyfin:8096`)
- Media served from external USB drive (`/Volumes/Windows Portable`)
- **Laptop must be on** for anything to work — this is the single biggest constraint

**Frontend** (React 19 + Vite + Capacitor Android):
- `jellyfinConfig.baseUrl` is a **dynamic getter**: `localStorage` → `import.meta.env` → proxy path `/jellyfin`
- Login page (`Login.tsx`) has a **Server URL** field — user types it manually
- URL stored in `movixy_server_url` localStorage key
- All API calls (via `jellyfin-api.client.ts`) and stream URLs (via `media-playback.service.ts`) use `this.baseUrl` dynamically
- **Capacitor config** already permissive: `allowNavigation: ['*']`, `cleartext: true`, `android.allowMixedContent: true`
- **PWA cache** uses `NetworkFirst` for API calls, `CacheFirst` for images — works with any origin

**Authentication**:
- Jellyfin native auth (username + password → `AccessToken`)
- Token stored encrypted in localStorage via AES-GCM
- Jellyfin supports **managed users** (parental controls, restricted libraries) — already available, no code needed

**Current Limitations**:
- Remote access only works via cloudflared (if made persistent)
- No Tailscale/WireGuard on any device
- No "connection type" detection in UI
- No QR code or deeplink for URL pre-configuration

---

## Tailscale Technical Overview

Tailscale is a **mesh VPN** built on WireGuard:
- Each device gets a unique **Tailscale IP** (100.x.y.z) and optionally a **MagicDNS name** (`hostname.tailnet-name.ts.net`)
- End-to-end encrypted, peer-to-peer connections (DERP relay fallback when NAT doesn't allow direct)
- **Free tier**: 3 users, 100 devices — enough for admin + 2 friends
- **Headscale**: self-hosted Tailscale control server — unlimited users, zero cost (but you host the coordination server)

### How It Works for Jellyfin

```
┌──────────────┐         ┌──────────────┐
│  Raspberry Pi│ ◄───────│  Friend's    │
│  (or Laptop) │ Tailnet │  Phone       │
│  Jellyfin:   │ Mesh    │  Movixy App  │
│  100.x.y.z   │  VPN    │  100.a.b.c   │
│  :8096       │         │              │
└──────────────┘         └──────────────┘
       ▲                        ▲
       │   WireGuard P2P        │
       └────────────────────────┘
       (Direct connection if NAT allows,
        otherwise DERP relay)
```

Each device:
1. Installs Tailscale
2. Authenticates to the same tailnet (via 1-click auth URL)
3. Gets a Tailscale IP and MagicDNS name
4. Can reach any other device on the tailnet by IP or DNS name

For Jellyfin: friends just point Movixy to `http://100.x.y.z:8096` or `http://jellyfin.tailnet-name.ts.net:8096`

---

## Key Files Examined

### `docker-compose.yml` — Current Server Setup
```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin
    ports: [8096:8096, 8920:8920]
    volumes:
      - ./jellyfin/config:/config
      - ./jellyfin/cache:/cache
      - /Volumes/Windows Portable :/media/movies:ro

  tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel --url http://jellyfin:8096
```

- **Impact**: cloudflared becomes **optional** (or removed if Tailscale replaces it entirely). If using Tailscale **sidecar** method, a `tailscale` service is added alongside Jellyfin.

### `src/core/config/jellyfin.config.ts` — Base URL Logic
```typescript
get baseUrl(): string {
  const rawUrl =
    localStorage.getItem('movixy_server_url') ||
    import.meta.env.VITE_JELLYFIN_URL ||
    '/jellyfin';
  // sanitization...
}
```

- **Impact**: **Minimal change**. The dynamic getter already handles any URL (local IP, Tailscale IP, MagicDNS, etc.). The user/friend just enters the Tailscale URL at login.

### `src/presentation/components/Login/Login.tsx` — Login Form
- Has a Server URL text field, username, password
- Stores `movixy_server_url` in localStorage on submit
- Placeholder: `http://192.168.x.x:8096`

- **Impact**: URL field **hint** could mention Tailscale MagicDNS. Optionally add **connection-type indicator** (Tailscale vs local vs WAN). For friends, consider **pre-filling** the MagicDNS URL or generating a **QR code / deeplink** that sets the URL automatically.

### `capacitor.config.ts` — Capacitor Permissions
```typescript
server: { cleartext: true, allowNavigation: ['*'] },
android: { allowMixedContent: true }
```
- **Impact**: **No change needed**. Already allows navigation to Tailscale IPs and cleartext HTTP traffic. Tailscale's virtual network is treated as a regular network interface — no special Capacitor config required.

### `jellyfin-api.client.ts` — API Client
- All requests go through `CapacitorHttp.request({ url: ... })`
- URLs built from `this.baseUrl` + endpoint path
- Streaming URLs built from `getStreamUrl()` and `getPlaybackInfo()` — both use `this.baseUrl`
- **Impact**: **No change needed**. All URL resolution is already dynamic through `jellyfinConfig.baseUrl`.

### `media-playback.service.ts` — Playback Resolution
- Builds HLS stream URLs from `this.client.baseUrl`
- Transcoding URLs also relative to baseUrl
- **Impact**: **No change needed**.

### `src/presentation/components/OfflineIndicator/OfflineIndicator.tsx` — Connection Loss
- Shows "Sin conexión" when browser fires `offline` event
- **Impact**: Consider enhancing for Tailscale connection loss (e.g., "Tailscale desconectado" vs "Internet caído")

### `.env` — Dev Environment
```
VITE_JELLYFIN_URL=http://localhost:8096
```
- **Impact**: Dev stays as localhost. Prod/friend builds could set `VITE_JELLYFIN_URL` to Tailscale MagicDNS URL for pre-configuration.

---

## Implementation Approaches

### Approach 1: Tailscale on Host Machine (Simplest)
Install Tailscale **directly on macOS** (not in Docker):
1. `brew install --cask tailscale` or download from tailscale.com
2. Sign in with GitHub/Google/Microsoft account
3. Enable **MagicDNS** in Tailscale admin console
4. Share the MagicDNS URL (`http://movixy-laptop.tailnet-name.ts.net:8096`) with friends

**Jellyfin stays in Docker, exposed on `:8096` — Tailscale on host routes traffic to it.**

| Aspect | Detail |
|--------|--------|
| **Setup complexity** | **Very Low** — install Tailscale, login, share URL |
| **Docker changes** | None (cloudflared can stay or be removed) |
| **Dependencies** | Tailscale installed on host |
| **Security** | Excellent — WireGuard encryption, no open ports |
| **Limitation** | Laptop must still be on + connected to Tailscale |
| **Friend friction** | Friends install Tailscale phone app + enter URL |

**Files changed**: `docker-compose.yml` (remove or comment cloudflared — optional)
**Effort**: ~30 min setup, 0 code changes

### Approach 2: Tailscale Sidecar in Docker (Portable)
Add a **Tailscale sidecar container** to `docker-compose.yml`:
```yaml
services:
  jellyfin:
    # ... same as today

  tailscale:
    image: tailscale/tailscale:latest
    hostname: movixy-jellyfin
    environment:
      - TS_AUTHKEY=tskey-auth-xxxxx  # one-time pre-auth key
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_USERSPACE=false
    volumes:
      - ./tailscale/state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - NET_ADMIN
      - NET_RAW
    restart: unless-stopped
```

Then share Jellyfin via **Tailscale Serve** (Tailscale's built-in reverse proxy):
```
tailscale serve --bg --https=443 http://jellyfin:8096
```

This makes `https://movixy-jellyfin.tailnet-name.ts.net:443` → Jellyfin's HTTP `:8096`.

| Aspect | Detail |
|--------|--------|
| **Setup complexity** | Medium — Docker networking + auth key |
| **Docker changes** | Add `tailscale` service in docker-compose.yml |
| **State management** | `./tailscale/state` volume (persists auth) |
| **Pre-auth key** | Generate in Tailscale admin console (one-time use) |
| **Tailscale Serve** | Provides HTTPS termination + Funnel option |
| **Friend UX** | HTTPS URL via Tailscale Serve (trusted cert) |

**Files changed**: `docker-compose.yml` (add tailscale service, optionally remove cloudflared)
**New files**: `tailscale/` directory for state
**Effort**: Medium (1-2h setup)

### Approach 3: Headscale (Self-Hosted Control Server)
**Deploy your own Tailscale coordination server** — unlimited users, complete control.

```yaml
services:
  headscale:
    image: headscale/headscale:latest
    command: headscale serve
    volumes:
      - ./headscale/config:/etc/headscale
      - ./headscale/data:/var/lib/headscale
    ports:
      - 8080:8080  # Web UI
      - 9090:9090  # gRPC
    restart: unless-stopped
```

| Aspect | Detail |
|--------|--------|
| **Setup complexity** | **High** — you host the coordination server |
| **Where to host** | Needs a reachable VPS (Oracle free tier, $5 Linode, or a second always-on device) |
| **User limit** | **Unlimited** — no free-tier cap |
| **Docker changes** | Add `headscale` service |
| **Friend UX** | Same as Tailscale — install client, auth to your Headscale URL |
| **Complexity cost** | You manage updates, backups, and uptime of the Headscale server |

**Files changed**: `docker-compose.yml` (add headscale + potentially separate server)
**New files**: `headscale/config/` directory
**Effort**: High (3-5h setup + ongoing maintenance)

### Approach 4: Tailscale on Dedicated Device (Pi 5)
**Best long-term solution** — Jellyfin runs on a Pi 5, Tailscale provides access:

1. Flash Raspberry Pi OS Lite on Pi 5
2. Install Docker + docker-compose
3. Copy Jellyfin config + docker-compose to Pi
4. Connect external USB drive to Pi
5. Install Tailscale on Pi (host or sidecar)
6. Share MagicDNS URL with friends

| Aspect | Detail |
|--------|--------|
| **Setup complexity** | Medium — Pi setup + migration |
| **Pi 5 cost** | ~$80 (board + PSU + case) |
| **Laptop needed?** | **No** — Pi runs 24/7 at ~10W |
| **Transcoding** | Pi 5 handles 1-2 1080p transcodes; struggles with 4K |
| **Friend UX** | Same URL always-on |

**Files changed**: Same as Approach 2 (Tailscale sidecar config)
**Effort**: High (4-6h for full Pi setup + migration)

---

## Architecture Impact Diagram

```
                    BEFORE (Current)
                    ═════════════════
                    
   Friend Phone ───► Internet ───► cloudflared ───► Jellyfin (laptop Docker)
   (no access)         │              │
                   No tunnel      Ephemeral
                   configured     (no auth)

                    AFTER (Tailscale Mesh)
                    ═══════════════════════

   ┌─ Admin Laptop ─────────────────────┐
   │  Jellyfin (:8096)                  │
   │  Tailscale Client (100.x.y.1)      │
   │  └─ Docker: jellyfin + network     │
   └─────────┬──────────────────────────┘
             │
      ╔══════╪══════════════════════════╗
      ║      │   TAILNET (Mesh VPN)     ║
      ║      │   WireGuard P2P/Relay    ║
      ╚══════╪══════════════════════════╝
             │
   ┌─────────┴──────────────────────────┐
   │  Friend Phone                      │
   │  Movixy App                        │
   │  Tailscale Client (100.a.b.c)      │
   │  URL: http://100.x.y.1:8096       │
   │   or http://jellyfin.ts.net:8096   │
   └────────────────────────────────────┘

   ┌─ Raspberry Pi 5 (future) ──────────┐
   │  Jellyfin Docker (:8096)           │
   │  Tailscale Client (100.x.y.2)      │
   │  └─ USB Drive mounted              │
   │  Laptop: FREE, no longer needed    │
   └────────────────────────────────────┘
```

---

## Friend Onboarding Flow

```
Step 1: Install Tailscale
        ├── App Store / Google Play → "Tailscale"
        ├── Create account (GitHub/Google/Microsoft/Email)
        └── Sign in (1-click auth)

Step 2: You share access
        ├── Tailscale admin console → "Share" your device
        └── Or: Share MagicDNS name with friend

Step 3: Open Movixy
        ├── Enter server URL:
        │   http://jellyfin.tailnet-name.ts.net:8096
        │   (or your Tailscale IP)
        ├── Enter Jellyfin username + password
        └── Done! Streaming over encrypted mesh
```

### Friend UX Friction Points
1. **Must install Tailscale** — the biggest friction for non-technical users
2. **Must have a Tailscale account** — requires GitHub/Google/Apple/Microsoft login
3. **Must enter the URL manually** — unless we pre-configure or generate a QR code
4. **Android TV / Fire TV** — Tailscale client works but setup via remote is painful

---

## Changes Needed Per Component

### Infrastructure (docker-compose.yml)
| Change | Complexity | Details |
|--------|-----------|---------|
| Add Tailscale sidecar | Medium | Docker networking, TUN device, auth key |
| Remove/retire cloudflared | Low | Comment out or remove `tunnel` service |
| Add persistent state dir | Low | `./tailscale/state` volume |
| (Optional) Headscale service | High | Separate VPS or server needed |

### Frontend Code
| File | Change | Complexity | Why |
|------|--------|-----------|-----|
| `Login.tsx` | Update URL hint/placeholder text | **Low** (~5 min) | Suggest MagicDNS URL format for TV users |
| `Login.tsx` | Add optional QR code auto-fill | **Medium** | Generate deeplink that pre-fills server URL |
| `Login.tsx` | Add connection-type label | **Low** (~15 min) | Show "Tailscale" badge when URL pattern matches Tailscale IP/DNS |
| `jellyfin.config.ts` | **No change** | **None** | Already handles dynamic URLs |
| `api-cache.ts` | **No change** | **None** | URL-based cache key, works with any origin |
| New: `ConnectionIcon.tsx` | Tailscale connection status | **Low** (~30 min) | Small badge showing connected via Tailscale vs local |
| New: `settings/` | Server URL config page | **Low** (~1h) | For power users to change URL after login |
| Capacitor config | **No change** | **None** | Already allows cleartext + any navigation |

### Backend / Jellyfin Config
| Change | Complexity | Details |
|--------|-----------|---------|
| Create managed users for friends | **Low** (admin UI) | Jellyfin Dashboard → Users → Add |
| Set library permissions | **Low** (admin UI) | Per-user library access controls |
| Set streaming quality limits | **Low** (admin UI) | Limit bandwidth if needed |
| Configure Tailscale ACL | **Medium** | `tailscale acl` — restrict which devices friends can reach |

### New Documentation
| Item | Complexity | Details |
|------|-----------|---------|
| Friend setup guide | Low (~15 min) | Step-by-step: install Tailscale → login → enter URL |
| Admin setup guide | Medium (~30 min) | Tailscale install, auth, MagicDNS, ACL config |

---

## Comparison Table

| Aspect | Approach 1 (Host) | Approach 2 (Sidecar) | Approach 3 (Headscale) | Approach 4 (Pi) |
|--------|-------------------|---------------------|----------------------|----------------|
| **Setup Effort** | 30 min | 1-2h | 3-5h | 4-6h |
| **Docker Changes** | None | Add `tailscale` service | Add `headscale` + `tailscale` | Same as 2 |
| **Laptop Dependency** | Yes | Yes | Yes | **No** |
| **User Limit** | 3 (free) | 3 (free) | **Unlimited** | 3 (free) |
| **Cost** | $0 | $0 | VPS cost (~$5/mo) | $80 (Pi) |
| **Friend UX** | Install TS + enter IP | Install TS + MagicDNS | Install TS + your URL | Same as 2 |
| **HTTPS** | MagicDNS (cert) | Tailscale Serve | Tailscale Serve | Tailscale Serve |
| **Suitable for TV** | Poor (remote input) | Poor | Poor | **Same** |

---

## Risks & Edge Cases

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Tailscale DERP relay slowdown** | 100-200ms latency if P2P fails | Direct connections work for most NAT types; DERP is still encrypted, just slower |
| **Firewall blocks Tailscale** | Can't connect | Tailscale uses HTTPS-like traffic (443) + STUN — most networks allow it |
| **3-user limit on free Tailscale** | Can't add more than 2 friends | Upgrade to Tailscale Personal ($6/mo) or use Headscale (free, self-hosted) |
| **Tailscale auth key expires** | Sidecar stops connecting | Use one-time pre-auth keys, or set up OAuth for auto-renewal |
| **MagicDNS name changes** | Friend's saved URL breaks | Use Tailscale IP (static) or advise friends to save the IP, not DNS name |
| **Laptop sleeps/goes to work** | Jellyfin unreachable | --- This is the fundamental constraint --- |
| **Tailscale on Android TV** | Cumbersome remote UI setup | Can pre-install Tailscale APK, but auth flow is painful via remote |

### Friend UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **"What's Tailscale?"** | Friend confusion | Provide simple written guide |
| **Friend on iPhone** | Need App Store download, same flow | Works identically |
| **Friend on Fire TV** | Tailscale APK installation is complex | Use Cloudflare Tunnel for TV-only friends |
| **Friend's Tailscale account** | Must use GitHub/Google/Apple/Microsoft | Most people have one of these |
| **URL entry on mobile** | Typing IP/DNS is tedious on phone keyboard | QR code / deeplink from admin |

### Migration & Rollback

| Scenario | Plan |
|----------|------|
| **Tailscale doesn't work for friend** | Friend removes Tailscale, goes back to Cloudflare URL |
| **Want to remove Tailscale** | Uninstall apps, remove sidecar from docker-compose, `tailscale down` on host |
| **Going from laptop → Pi** | Copy Jellyfin config, same docker-compose (with Tailscale sidecar), point to Pi's IP |
| **Free tier limit reached** | Upgrade to Tailscale Personal, or migrate to Headscale |
| **Cloudflared coexistence** | Both can run simultaneously — cloudflared for WAN access, Tailscale for mesh. No conflict. |

---

## Effort Estimate Summary

| Component | Effort | Who |
|-----------|--------|-----|
| Install Tailscale on host (macOS) | 30 min | You |
| Enable MagicDNS in admin console | 5 min | You |
| Create Jellyfin managed users | 15 min | You |
| Write friend setup guide | 15 min | You |
| Update Login.tsx placeholder/hint | 15 min | Dev |
| (Optional) QR code / deeplink | 2-3h | Dev |
| (Optional) Connection-type badge | 30 min | Dev |
| (Optional) Settings page for URL | 1h | Dev |
| (Optional) Tailscale sidecar in Docker | 1-2h | You |
| (Optional) Headscale server setup | 3-5h | You |
| (Optional) Pi 5 + migration | 4-6h | You |

**Total dev time (required)**: ~1h (minor UI hints) or **0h** (no frontend changes needed)
**Total infrastructure time**: 30 min (host Tailscale) to 6h (full Pi migration)
**Code changes**: 0-3 files touched, 0-100 lines changed

---

## Ready for Proposal

**Yes.** The exploration is complete. The codebase needs **zero structural changes** for Tailscale to work — it already supports dynamic Jellyfin URLs, Capacitor allows any network target, and the API client resolves all URLs from the configurable `baseUrl`.

Recommended path for the proposal:
1. **Approach 1 (host Tailscale)** for immediate setup — 30 min, zero code changes
2. **Approach 2 (Docker sidecar)** as containerized alternative for the Pi
3. Frontend: minimal polish (URL hint text, optional deeplink) as optional enhancements
4. Cloudflared tunnel can coexist or be retired

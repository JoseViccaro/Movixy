# Exploration: Remote Access for Movixy

## Current State

### How It Works Today

Movixy follows Clean Architecture with these relevant components:

**Jellyfin Server** (backend):
- Runs locally via Docker (`docker-compose.yml`)
- Serves media from an **external USB drive** (`/Volumes/Windows Portable`)
- Exposed on `localhost:8096` / `127.0.0.1:8096`
- Already has a **cloudflared tunnel** container configured (though in ephemeral mode — `tunnel --url http://jellyfin:8096`)

**Frontend** (React PWA + Capacitor Android):
- Connects to Jellyfin via a **configurable URL** (user enters it at login)
- Default fallback: `http://localhost:8096` (dev) or `/jellyfin` (Vite proxy)
- The `.env` file sets `VITE_JELLYFIN_URL=http://localhost:8096`
- All API calls and streaming URLs are built from `jellyfinConfig.baseUrl` — a dynamic getter that reads from `localStorage`, env, or proxy path in that order
- **Capacitor config** already allows any navigation target (`allowNavigation: ['*']`) and cleartext

**Authentication**:
- Jellyfin's native auth (username/password → `AccessToken`)
- Token stored encrypted in localStorage via AES-GCM
- Token is NOT persisted for "remember me" across sessions (only per browser tab)
- No concept of friend/family accounts beyond Jellyfin's own user system
- Jellyfin natively supports **managed users** (parental controls, restricted libraries)

**Media Storage**:
- Mounted external USB drive at `/Volumes/Windows Portable :/media/movies:ro`
- Local `media/movies/` and `media/series/` directories (may be copies or symlinks)
- **This is the critical constraint**: media lives on a USB drive connected to the laptop

**Network Access**:
- Currently **local network only**
- Vite dev proxy at `/jellyfin` → `http://127.0.0.1:8096`
- Cloudflared tunnel exists but in default ephemeral mode (no tunnel ID, no authentication)

### Key Observation

The laptop **must be on** for Jellyfin to serve media. The cloudflared tunnel just creates a public URL to the already-running server — it doesn't solve the laptop-as-server constraint.

---

## The Real Problem

There are **two independent constraints** here:

1. **Not same network** → solved by tunnels (Cloudflare, Tailscale) or public hosting
2. **Laptop doesn't stay on** → requires either:
   - A dedicated always-on device (Pi, NUC, old PC, NAS)
   - Cloud hosting (Oracle free tier, VPS)
   - The media must be accessible from that device

The second constraint is the real blocker. No tunneling solution fixes this.

---

## Option Comparison

### Option 1: Dedicated Device + Cloudflare Tunnel ⭐ RECOMMENDED

| Aspect | Detail |
|--------|--------|
| **What** | Raspberry Pi 4/5 (or old laptop) running Jellyfin + cloudflared 24/7 |
| **Cost** | ~$50-80 one-time (RPi 5), ~$3-5/year electricity |
| **Laptop needed?** | No |
| **Setup complexity** | Medium (flash SD, install Docker, mount media to Pi) |
| **UX for friends** | Excellent — they get a single URL, login with Jellyfin credentials |
| **Media location** | USB drive plugged into Pi, or NAS shared via SMB/NFS |
| **Bandwidth** | Depends on home internet upload speed |
| **Security** | Excellent — Cloudflare Tunnel = zero open ports, DDoS protection |
| **Transcoding** | RPi 5 can handle 1-2 simultaneous 1080p transcodes |

**Pros:**
- True always-on, laptop completely free
- Cloudflare Tunnel already in your docker-compose — you know the setup
- One-time hardware cost, zero monthly fees
- You already have the Cloudflare setup (just need to make tunnel persistent)
- Jellyfin already supports managed users for friends/family

**Cons:**
- Requires buying/configuring a Pi if you don't have one
- RPi 5 struggles with 4K transcoding (direct play works if client supports codec)
- USB drive must be physically connected to the Pi or shared over network
- Home internet upload speed is the bottleneck for remote streaming

**Cloudflare Persistent Tunnel Setup:**
```
# docker-compose.yml (already most of the way there)
cloudflared:
  image: cloudflare/cloudflared
  command: tunnel run --token <YOUR_TUNNEL_TOKEN>
  # 1. `cloudflared tunnel login`
  # 2. `cloudflared tunnel create movixy`
  # 3. `cloudflared tunnel route dns movixy <your-domain>` or use `<uuid>.cfargotunnel.com`
  # 4. Point Jellyfin's domain to the tunnel, users get https://movixy.tudominio.com
```

---

### Option 2: Oracle Cloud Free Tier (ARM VPS)

| Aspect | Detail |
|--------|--------|
| **What** | Free Oracle Cloud ARM instance (4 OCPU, 24GB RAM) running Jellyfin |
| **Cost** | $0/month (always free) |
| **Laptop needed?** | No |
| **Setup complexity** | High (cloud networking, Jellyfin install, media upload) |
| **Media location** | Must be uploaded to cloud (200GB free storage) |
| **Bandwidth** | 10TB/month egress — plenty for personal streaming |
| **Transcoding** | Handles 4K easily — this is a proper server |

**Pros:**
- Real server in the cloud, zero electricity at home
- Excellent performance (ARM Ampere CPUs are serious)
- 10TB outbound bandwidth per month is generous
- No home internet upload bottleneck
- Can use Cloudflare Tunnel or just expose Jellyfin directly with SSL

**Cons:**
- **Storage is the killer**: 200GB free is nothing for a media collection
- Additional block storage costs money (~$0.10/GB/month)
- Uploading TBs of media would take days/weeks
- Oracle free tier is notorious for being hard to get (capacity limits)
- Media file management at distance is annoying
- You lose the "local" convenience of plugging in a USB drive

---

### Option 3: Tailscale Mesh VPN

| Aspect | Detail |
|--------|--------|
| **What** | Tailscale creates a secure mesh VPN; each device gets a Tailscale IP |
| **Cost** | Free tier: **3 users**, 100 devices |
| **Laptop needed?** | Yes — unless Jellyfin runs on a dedicated device |
| **Setup complexity** | Low (install Tailscale on each device, 1-click auth) |
| **Media location** | Same as current (USB drive on laptop or Pi) |
| **Security** | Excellent — no open ports, WireGuard-based |

**Pros:**
- **Simplest setup** — install Tailscale on every device, they connect via Tailscale IP
- Direct peer-to-peer connections (no relay if both sides have good NAT)
- Can share specific devices with specific users
- Works well with Jellyfin's existing auth
- Free for up to 3 users (the admin + 2 friends/family)

**Cons:**
- **3 user limit** on free tier — if you want more than 2 friends + yourself, you pay
- Each friend must **install the Tailscale app** on their phone/TV
- Doesn't work great on Android TV / Fire TV (Tailscale client exists but setup is awkward)
- If laptop must be the server, laptop still needs to stay on
- Combined with a dedicated device (Pi + Tailscale), this becomes a great solution

---

### Option 4: Upgrade Existing Cloudflare Tunnel (laptop stays on)

| Aspect | Detail |
|--------|--------|
| **What** | Make the current cloudflared persistent with authentication |
| **Cost** | $0 |
| **Laptop needed?** | **Yes** |
| **Setup complexity** | Low (already have the container, just add tunnel auth) |
| **Media location** | Same as current (USB drive on laptop) |

**Pros:**
- Minimal change — you already have cloudflared in docker-compose
- Learn once, reuse for Option 1 later
- Friends just need a URL and Jellyfin credentials
- Zero cost

**Cons:**
- **Laptop must stay on** — this is the main requirement you want to remove
- If laptop sleeps, goes to work, or dies → no access
- Still a useful **intermediate step** while you buy/config a Pi

---

## Architecture Impact Assessment

### Frontend Changes: ~Minimal

The frontend already supports configurable Jellyfin URLs:

- `jellyfinConfig.baseUrl` reads from `localStorage` → `import.meta.env` → proxy path
- Login page allows entering any server URL (remembered in localStorage)
- All API calls and streaming URLs are built dynamically from `baseUrl`
- Capacitor allows cleartext and any navigation target
- PWA cache works with any origin (NetworkFirst for API, CacheFirst for images)

**What would change:**
- Ideally, hide the "Server URL" field from friends (pre-configure it)
- Or provide a QR code / deeplink that sets the server URL
- Optionally: add a "Connection Settings" page for advanced users

### Backend Changes: ~Medium

The Jellyfin server itself needs to be accessible:

**With Cloudflare Tunnel (Option 1):**
- Change docker-compose cloudflared from ephemeral to persistent tunnel
- Add tunnel auth (Cloudflare Access or Jellyfin login)
- No changes to Jellyfin itself

**With Tailscale (Option 3):**
- No server changes — just networking

**With Oracle Cloud (Option 2):**
- Full Jellyfin deployment in cloud
- Data migration effort

### Authentication Changes: ~Low

Jellyfin already supports:
- **Managed users**: Create restricted accounts for friends/family
- **Library access controls**: Limit which libraries each user sees
- **Parental controls**: Rating-based restrictions

No code changes needed — just Jellyfin admin configuration.

### Streaming Performance

**Critical consideration — home upload speed:**
- Most residential ISPs offer 10-50 Mbps upload
- A single 1080p H264 stream needs ~8-10 Mbps
- 4K stream needs ~25-40 Mbps
- If friends stream from your home, you burn through your upload bandwidth
- **One 4K stream can saturate a typical home upload**

**Jellyfin transcoding helps here:**
- Can downscale 4K → 1080p for remote users
- Can lower bitrate for slower connections
- But transcoding needs CPU/GPU power (RPi 5 is marginal; Oracle cloud is great)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Home upload too slow for friends | Bad UX, buffering | Limit remote quality in Jellyfin, use hardware transcoding |
| Pi can't handle multiple transcodes | Choppy playback | Direct Play where possible, limit concurrent remote streams |
| Media collection > 200GB (cloud) | Can't use free cloud tiers | Use dedicated device at home (Option 1) |
| Friend needs Tailscale client installed | Friction for non-tech users | Use Cloudflare Tunnel (no client needed) |
| Cloudflare Tunnel exposes Jellyfin to internet | Security concern | Add Cloudflare Access (free) or Jellyfin auth (already there) |
| External drive fails | All media lost | Backup strategy (separate discussion) |
| Laptop goes to sleep at night | No access during that time | Use Option 1 (dedicated device) |

---

## Recommendation

### Short-term (this week): Persistent Cloudflare Tunnel
1. Make the existing cloudflared tunnel **persistent** (create a named tunnel, authenticate it)
2. This solves the "same network" problem immediately
3. Laptop still needs to be on — but it's a quick win
4. Bonus: friends can test and give feedback while you build the permanent solution

### Medium-term: Raspberry Pi 5 with Persistent Cloudflare Tunnel
1. Buy a Pi 5 (~$80) or repurpose an old laptop/PC
2. Install Docker + Jellyfin + cloudflared on the Pi
3. Connect the external USB drive (or NAS share) to the Pi
4. Move Jellyfin config from laptop to Pi
5. **Laptop is now free** — Pi stays on 24/7 consuming ~10W
6. Same Cloudflare Tunnel config — just point to Pi instead of laptop

### Long-term (optional): Oracle Cloud Free Tier
If your media collection fits in 200GB and you're willing to upload it — the best performance option. But for most media collections, local storage wins.

**Why not Tailscale as primary recommendation?**
- 3-user limit on free tier
- Friends need to install software
- Awkward on Android TV / Fire TV
- Great as a **fallback** or **admin access** (you can SSH to the Pi via Tailscale)

---

## Next Steps for Proposal

1. **Start with Cloudflare Tunnel hardening** (immediate, laptop stays on):
   - Run `cloudflared tunnel login` to authenticate
   - Create a named tunnel: `cloudflared tunnel create movixy`
   - Update docker-compose to use `tunnel run --token`
   - Test with a friend
   - Everything works in parallel with current local setup

2. **Acquire/re-purpose always-on device**:
   - Raspberry Pi 5 (recommended) or old laptop/PC
   - Install Raspberry Pi OS Lite / Ubuntu Server
   - Install Docker + docker-compose

3. **Migrate Jellyfin to the dedicated device**:
   - Copy docker-compose service
   - Mount USB drive or network share
   - Same Cloudflare Tunnel config
   - Test and switch over

4. **Configure Jellyfin for friends**:
   - Create managed user accounts
   - Set library permissions
   - Set optional streaming quality limits

5. **Frontend polish** (optional, after everything works):
   - Auto-detect server URL (via QR code or env config)
   - Hide server URL field for friends
   - Add friend account management UI

---

## Affected Areas (when implemented)

- `src/core/config/jellyfin.config.ts` — likely no change (already dynamic)
- `src/presentation/components/Login/Login.tsx` — MAYBE add option to pre-configure URL
- `docker-compose.yml` — cloudflared persistent tunnel config
- No changes needed to: domain models, repositories, API client, streaming logic

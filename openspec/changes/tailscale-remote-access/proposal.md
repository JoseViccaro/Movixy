# Proposal: Tailscale Remote Access

## Intent

Friends and family cannot access Movixy's Jellyfin media server when the host laptop is away from home. Current cloudflared tunnel is unreliable (ephemeral, breaks on sleep) and adds latency. We need a persistent, low-latency mesh VPN for trusted users.

## Scope

### Phase 1 (In Scope — Now)
- Install Tailscale on host Mac M4
- Add up to 3 friends via Tailscale admin console
- Friends install Tailscale mobile app + open Movixy with MagicDNS URL
- Zero code changes to the codebase

### Phase 2 (In Scope — Later)
- Set up Raspberry Pi 5 with Docker + Jellyfin + Tailscale sidecar
- Migrate media USB drive from laptop to Pi
- Remove laptop dependency (24/7 server)
- Remove cloudflared tunnel

### Out of Scope
- Frontend URL hint/placeholder changes (optional, deferred)
- QR code / deeplink auto-fill for friends (deferred)
- Connection-type badge (Tailscale vs local) (deferred)
- Server URL settings page after login (deferred)
- Android TV remote auth flow improvements
- Headscale self-hosted deployment

## Capabilities

### New Capabilities
- `remote-access`: Private mesh VPN access to Jellyfin media server for trusted users

### Modified Capabilities
- None. Zero code changes — infrastructure only.

## Approach

**Phase 1**: Install Tailscale via `brew install --cask tailscale`, authenticate, enable MagicDNS + disable Key Expiry. Share access from admin console. Friends install mobile app. No Docker changes, no code changes. ~30 min setup.

**Phase 2**: Flash Pi OS → install Docker + Jellyfin + Tailscale sidecar → migrate USB drive → point DNS to Pi → decommission cloudflared. Laptop freed. 4-6h.

## Affected Areas

| Area | Impact | Description |
|------|--------|------------|
| Host macOS | Modified | Install Tailscale app, enable MagicDNS |
| Tailscale Admin Console | New | Configure ACLs, share with users |
| `docker-compose.yml` | Removed (P2) | Remove cloudflared sidecar |
| Raspberry Pi 5 | New (P2) | Docker + Jellyfin + Tailscale sidecar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 3-user free tier limit hit | Med | Upgrade to Premium ($6/mo) or evaluate Headscale |
| DERP relay latency if P2P fails | Low | Still encrypted; test with worst-case friend location |
| Laptop sleep breaks tunnel | Med | Phase 1 workaround: caffeinate. Solved by Phase 2. |
| MagicDNS hostname changes | Low | Share Tailscale IP as fallback; lock hostname |

## Rollback Plan

**Phase 1**: Uninstall Tailscale (`brew uninstall --cask tailscale`), remove users from admin console. Friends' apps stop connecting. Republish cloudflared tunnel if taken down. Effort: 5 min.

**Phase 2**: Revert to Phase 1: move USB drive back to laptop, restore docker-compose.yml with cloudflared. Effort: 30 min.

## Dependencies

- Friends must have iOS/Android devices for Tailscale app
- (Phase 2) Raspberry Pi 5 + power supply + SD card + case ($80)
- (Phase 2) USB drive media must be compatible with Pi 5 USB ports

## Success Criteria

- [ ] Friend can install Tailscale, authenticate, and reach Jellyfin login via MagicDNS URL (Phase 1)
- [ ] Friend can stream media without buffering or timeouts (Phase 1)
- [ ] Host laptop can sleep/wake without breaking the tunnel (Phase 2)
- [ ] No cloudflared dependency remains after Phase 2

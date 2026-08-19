# Specification: server-autodiscovery

## Scope & Purpose
Defines the functional and technical requirements for auto-discovering local Jellyfin media servers via network probing/broadcast (SSDP/mDNS where available, rapid subnet sweep fallback on web/PWA) and managing dual-URL resolution (LAN vs. WAN/Tailscale) with lowest-latency race and health-check fallback.

---

## Requirements

### Requirement 1: Server Discovery via Subnet Sweeping and SSDP/mDNS
The system SHALL discover reachable Jellyfin servers on the local network automatically without mandatory manual IP entry.

#### Scenario 1.1: Local network scan finds active Jellyfin server
- **Given** a user is on the Login view and has an active local Wi-Fi / Ethernet connection
- **When** auto-discovery is triggered (on mount or via refresh action)
- **Then** the probe SHALL ping standard Jellyfin ports (8096, 8920) across candidate IPs in the local subnet and SSDP/mDNS broadcast targets
- **And** for any endpoint returning a valid Jellyfin `/System/Info/Public` payload within 2500ms, the system SHALL register the server candidate with its `ServerName`, `Id`, `Address`, and detected round-trip latency.

#### Scenario 1.2: Web sandbox restricted broadcast fallback
- **Given** the application runs in a web browser sandbox where raw UDP broadcast is blocked
- **When** network auto-discovery executes
- **Then** the discovery engine SHALL execute a bounded concurrent HTTP probe sweep against candidate gateway ranges (e.g., `192.168.1.x`, `192.168.0.x`, `10.0.0.x`, `localhost`)
- **And** gracefully ignore network timeout/rejection without breaking UI responsiveness.

---

### Requirement 2: Dual-URL Latency Racing and Health Ping Fallback
The system SHALL support primary (LAN) and secondary/fallback (WAN, Tailscale, Reverse Proxy) endpoints for configured servers and route requests to the fastest responsive route.

#### Scenario 2.1: LAN endpoint is reachable and faster
- **Given** a configured server entry with both a LAN URL (`http://192.168.1.100:8096`) and a WAN/Tailscale URL (`https://jellyfin.example.com` or `http://100.x.y.z:8096`)
- **When** a connection check or login is initiated
- **Then** the system SHALL race health pings (`/System/Ping` or `/System/Info/Public`) concurrently against both URLs with a 2000ms timeout
- **And** select the lowest-latency responsive URL as the active `activeBaseUrl` for the current session.

#### Scenario 2.2: LAN endpoint times out (out of home / remote roaming)
- **Given** the device is outside the home LAN and the primary LAN URL fails or times out (>2000ms)
- **When** the health race completes
- **Then** the system SHALL seamlessly designate the responsive WAN/Tailscale URL as the active endpoint
- **And** notify the application state without throwing connection error alerts to the user.

---

### Requirement 3: Server Chip Selector in Login Presentation
The Login presentation component SHALL display discovered and saved servers as quick-select interactive chips.

#### Scenario 3.1: Discovered servers rendered as focusable chips
- **Given** one or more servers are discovered or retrieved from saved server history
- **When** the Login screen renders
- **Then** the component SHALL render a horizontal list/grid of server chips displaying server name, host address, and reachable badge (latency in ms or green online dot)
- **And** clicking or focusing (via TV D-pad / keyboard) on a chip SHALL populate the `serverUrl` input and trigger connection validation.

#### Scenario 3.2: Manual URL entry remains supported
- **Given** an environment where auto-discovery does not find the custom host
- **When** the user manually enters a custom URL into the server URL input
- **Then** the system SHALL validate the URL against `/System/Info/Public` upon submit and persist it into the recent servers list upon successful authentication.

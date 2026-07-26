# Movixy Architecture

## Overview

Movixy follows **Clean Architecture** principles with a clear separation into four layers:

```
┌─────────────────────────────────────────┐
│           Presentation                  │
│  (React Components, Pages, UI Hooks)    │
├─────────────────────────────────────────┤
│           Application                   │
│  (Use Cases, React Query Hooks)         │
├─────────────────────────────────────────┤
│              Domain                     │
│  (Models, Repository Interfaces)        │
├─────────────────────────────────────────┤
│               Data                      │
│  (API Clients, Repository Impls)        │
└─────────────────────────────────────────┘
```

## Layer Responsibilities

### Domain Layer (`src/domain/`)

Contains business logic and entities - completely independent of frameworks.

- **Models** (`domain/models/`)
  - TypeScript interfaces for Media, Movie, Series, User, etc.
  - No implementation details, just contracts

- **Repositories** (`domain/repositories/`)
  - Abstract interfaces defining data operations
  - e.g., `IMediaRepository.getMovies()`, `IMediaRepository.search()`

### Application Layer (`src/application/`)

Orchestrates application use-cases and manages server state using `@tanstack/react-query`.

- **Hooks** (`application/hooks/`)
  - Application hooks encapsulating data fetching (`useMedia.ts`, `useFavorites.ts`)
  - Bridges Domain repositories with Presentation components

### Data Layer (`src/data/`)

Implements the contracts defined in Domain using actual data sources.

- **Sources** (`data/sources/`)
  - Low-level HTTP clients (e.g., Jellyfin API client)
  - Mock data sources for testing

- **Repositories** (`data/repositories/`)
  - Concrete implementations of Domain interfaces
  - Transform API responses to Domain models

### Presentation Layer (`src/presentation/`)

React UI components - the only layer aware of React.

- **Pages** (`presentation/pages/`)
  - Top-level page components (e.g., Home)

- **Components** (`presentation/components/`)
  - Reusable UI components
  - Organized by feature (Login, Navbar, Hero, MovieRow, etc.)

- **Hooks** (`presentation/hooks/`)
  - Purely UI-focused hooks (e.g., DPAD navigation, fullscreen toggle)

### Core Layer (`src/core/`)

Shared configuration and utilities.

- **Config** (`core/config/`)
  - Environment variables
  - API configuration

## Data Flow

```
User Action
    ↓
Presentation Component
    ↓
Domain Repository Interface
    ↓
Data Repository Implementation
    ↓
API Client
    ↓
External API (Jellyfin)
```

Example: Fetching movies

```typescript
// 1. UI calls domain interface
const movies = await mediaRepository.getMovies();

// 2. Implementation handles API call
class JellyfinMediaRepository implements IMediaRepository {
  async getMovies(): Promise<Media[]> {
    const response = await jellyfinApi.get('/Movies');
    return this.mapToMedia(response);
  }
}
```

## Key Design Decisions

### 1. Path Aliases

Configured in `vite.config.ts`:

```typescript
alias: {
  '@': './src',
  '@domain': './src/domain',
  '@data': './src/data',
  '@application': './src/application',
  '@presentation': './src/presentation',
  '@core': './src/core',
}
```

### 2. CSS Modules

Each component has its own scoped CSS:

```
components/
├── MovieRow/
│   ├── MovieRow.tsx
│   └── MovieRow.module.css
```

### 3. Repository Pattern

Abstraction over data sources allows:
- Easy testing with mock implementations
- Swapping data sources without changing UI
- Centralized data transformation logic

## API Integration

### Jellyfin Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/Users/{id}/AuthenticateByName` | Login |
| `/Items` | Browse library |
| `/Search/Users/{id}` | Search |
| `/Users/{id}/ResumeItems` | Continue Watching |
| `/Items/{id}/PlaybackInfo` | Get stream URL |
| `/Library/Refresh` | Trigger scan |

### Authentication Flow

1. User enters credentials
2. API authenticates with Jellyfin
3. Server returns session token
4. Token stored in memory (not persisted)
5. Subsequent requests include token in header

## State Management

Movixy combines React built-ins and TanStack Query:

- **TanStack Query (`@tanstack/react-query`)** - Server state management, automatic caching, revalidation, and loading/error states in `@application/hooks`
- **useState** - Local component state (e.g., UI modals, input state)
- **useContext** - Theme and authentication context

## Component Hierarchy

```
App
├── AuthProvider
│   └── (login check)
├── Home
│   ├── Navbar
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Hero
│   ├── MovieRow[]
│   │   └── MediaCard[]
│   ├── MediaModal
│   │   └── VideoPlayer
│   └── LoadingSkeleton
```

## PWA Configuration

Service worker registered via `vite-plugin-pwa`:

- **Auto-update** - New versions detected and loaded
- **Offline fallback** - Cached content when offline
- **Installable** - Add to homescreen/desktop

## Testing Strategy

- **Unit Tests** - Repository logic, utility functions
- **Component Tests** - React Testing Library
- **Integration Tests** - API client responses

See `TESTS.md` for detailed testing guide.

## Future Considerations

### Potential Improvements

- **State Management**: React Query for caching and deduping
- **Testing**: Add E2E tests with Playwright
- **i18n**: Internationalization support
- **Themes**: Light mode, custom color schemes

## contributing

When adding features:

1. Identify the layer the logic belongs to
2. Create Domain interface/model first
3. Implement in Data layer
4. Consume in Presentation layer
5. Add tests for new functionality
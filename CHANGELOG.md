# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- README.md with project documentation
- ARCHITECTURE.md with technical design details
- **Watchlist Personal** - Agregar/quitar de mi lista (Jellyfin favoritos)
- **Soporte de Subtítulos** - Selector de CC en el reproductor
- **Tests** - Vitest con React Testing Library (19 tests)
- **CI/CD** - GitHub Actions workflow
- **Pre-commit hooks** - Husky + lint-staged

### Changed
- Updated README with custom Movixy documentation

### Added (Accesibilidad)
- Navegación por teclado (Esc para cerrar modales, F para fullscreen, M para mute)
- ARIA labels en todos los elementos interactivos
- Focus management automático en modales
- Soporte para screen readers

### Added (Performance)
- Lazy loading de MediaModal y VideoPlayer
- Code splitting: bundle principal reducido de ~725KB a ~203KB

---

## [0.1.0] - 2026-04-24

### Added
- Netflix-style UI with horizontal scroll rows
- Hero section with featured content
- Real-time search across media library
- Media modal with synopsis and episode list for series
- HLS video streaming with transcoding support
- Auto-recovery from network errors
- Continue Watching functionality
- PWA support with service workers
- Library refresh trigger from UI

### Fixed
- Video player optimization
- HLS autoplay issues
- Audio playback issues
- Video player compatibility across browsers
- Image fallback handling

### Technical
- Clean Architecture implementation (domain/data/presentation)
- React 19 with TypeScript
- Vite 8 build system
- CSS Modules for scoped styling
- Jellyfin API integration
- Path aliases configuration

---

## [0.0.0] - 2026-04-20

### Added
- Initial project setup
- Basic project structure
- Docker Compose for Jellyfin server

[Unreleased]: https://github.com/yourusername/movixy/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/movixy/releases/tag/v0.1.0
[0.0.0]: https://github.com/yourusername/movixy/releases/tag/v0.0.0
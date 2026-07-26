# Tasks: Frontend Premium UI (Estilo Netflix / Apple TV / HBO Max)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Rediseño visual UI Premium, resplandor ambiental, foco TV y reproductor OSD | PR 1 | Single PR, 100% tests included |

## Phase 1: Sistema de Diseño & Resplandor Ambiental (Foundation)

- [x] 1.1 Definir tokens CSS de iluminación ambiental HSL y aceleración GPU en [index.css](file:///Users/joseviccaro/Desktop/Movixy/src/index.css).
- [x] 1.2 Implementar resplandor cromático dinámico (*ambient color bleed*) en [ImmersiveBackdrop.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/ImmersiveBackdrop/ImmersiveBackdrop.tsx).

## Phase 2: Héroe, Filas y Tarjetas TV (Core Component UI)

- [x] 2.1 Enriquecer el componente [Hero.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/Hero/Hero.tsx) con degradados multicapa y microanimaciones de acción.
- [x] 2.2 Actualizar [MovieRow.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/MovieRow/MovieRow.tsx) y sus tarjetas con anillos de foco TV (*glow rings*) y centrado automático con DPAD.
- [x] 2.3 Integrar esqueletos de carga (*Shimmers*) en [Skeleton.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/Skeleton/Skeleton.tsx) para evitar parpadeos blancos durante la carga de datos.

## Phase 3: Modal de Detalles & Reproductor OSD (Interactive Media Experience)

- [x] 3.1 Rediseñar [MediaModal.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/MediaModal/MediaModal.tsx) con grid de episodios, progreso de reproducción y selector de audio.
- [x] 3.2 Incorporar controles flotantes de salto (+/-10s), selector rápido de idioma y botón "Saltar Intro" en el OSD de [VideoPlayer.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/VideoPlayer/VideoPlayer.tsx).

## Phase 4: Resiliencia & Verificación (Testing & Quality)

- [x] 4.1 Mejorar vistas de error y estado vacío en [ErrorBoundary.tsx](file:///Users/joseviccaro/Desktop/Movixy/src/presentation/components/ErrorBoundary/ErrorBoundary.tsx) con botones de reintento.
- [x] 4.2 Ejecutar la suite de pruebas unitarias (`npm run test:run`) y la verificación de tipos/lint (`npm run lint`).

# Implementation Tasks: movixy-premium-ux-refactor

## PR 1: Foundations and Cleanup (The Foundation)
- [x] T1.1: Refactor de `Home.tsx` a `MediaPlaybackService`. ✅
- [x] T1.2: Migración de `Navbar` y `FilterBar` a CSS Modules + Glassmorphism. ✅
- [x] T1.3: Eliminación de estilos inline en favor de `Home.module.css`. ✅
- [x] T1.4: Verificación de tests (arreglando regresiones). ✅

## PR 2: Immersion System (The Wow Factor) ✅
- [x] T2.1: Implementación del componente `ImmersiveBackdrop`. ✅
- [x] T2.2: Creación del hook `useBackdrop` y su contexto. ✅
- [x] T2.3: Integración en `Home`, `MovieCard` y `Hero`. ✅
- [x] T2.4: Cross-fading dinámico de fondos. ✅

## PR 3: Pro Navigation (The TV Experience) ✅
- [x] T3.1: Upgrade de `useDpadNavigation` con memoria de sección. ✅
- [x] T3.2: Integración en `Home.tsx` con `data-section`. ✅
- [x] T3.3: Soporte mejorado para teclas de Fire TV. ✅

## Review Workload Forecast
- Estimated changed lines: ~500
- Chained PRs recommended: YES
- Decision needed before apply: YES (Chained PRs selected)

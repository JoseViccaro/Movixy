# Proposal: movixy-premium-ux-refactor

## Intent
Transform the Movixy interface into an immersive "Netflix-style" experience, optimized for TV (D-pad) and desktop, removing style technical debt and centralizing navigation logic.

## Scope
* **Implement `ImmersiveBackdrop`**: A global component that shows the background art of the focused media with smooth transitions and dynamic gradients.
* **Refactor to CSS Modules**: Migrate `Home.tsx`, `Hero.tsx`, and `MovieRow.tsx` to CSS modules, removing inline styles.
* **Spatial Navigation Hook**: Evolve `useDpadNavigation` into a system that automatically detects focus (Spatial Navigation) based on the position of elements in the DOM.
* **Domain Logic Extraction**: Move "first episode" and "stream URL" resolution logic from components to a `MediaService` in the application layer.

## Tradeoffs
* **Performance**: Immersive backdrop requires loading additional images. We will use `OptimizedImage` with placeholders and blur for an instantaneous feel.
* **Refactor Effort**: Migrating to CSS Modules takes time but ensures TV support (overscan, safe areas) is consistent throughout the app.

# Specifications: movixy-premium-ux-refactor

## Functional Requirements
* **RF-001 (Immersive Backdrop)**: When focusing on a `MovieCard` or the `Hero`, the application background must smoothly transition (500ms fade) to the background image (`backdropPath`) of that media.
* **RF-002 (Gradient Overlay)**: The backdrop must have a superimposed radial and linear gradient to ensure interface text is always legible (vignette effect).
* **RF-003 (Spatial Navigation)**: The D-pad system must allow navigation between rows (`MovieRow`) and the `Navbar` using only keyboard/remote arrows, maintaining one clearly focused element at all times.
* **RF-004 (Media Service)**: There must be a `getPlayableMedia(mediaId)` function that resolves whether it's a movie or the next episode of a series before opening the player.

## Technical Requirements
* **RT-001 (CSS Modules)**: Prohibited use of the `style` property in components for complex layouts. All must be in `.module.css` files.
* **RT-002 (Layer Separation)**: The `VideoPlayer` component must not directly call the `JellyfinApiClient`. It must receive the already resolved URL.
* **RT-003 (TV Compatibility)**: All interactive components must support the `data-focusable="true"` attribute for the Spatial Navigation system to recognize them.

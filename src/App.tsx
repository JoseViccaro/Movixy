/**
 * App.tsx is no longer the main entry point.
 * Routing is now handled by src/core/router/index.tsx
 * and the layout is in src/presentation/layouts/AppLayout.tsx
 * 
 * This file is kept for backward compatibility but is not used.
 * The app entry is main.tsx → RouterProvider → router → AppLayout/Pages
 */

export default function App() {
  return null;
}
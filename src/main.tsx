import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './core/router'
import { ToastProvider } from './presentation/components/Toast/Toast'
import { QueryProvider } from '@/core/providers/QueryProvider.tsx'
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary/ErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Root-level boundary: catches crashes in providers and the router itself */}
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
)

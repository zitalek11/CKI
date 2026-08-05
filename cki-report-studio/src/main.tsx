import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppShell } from '@/app/AppShell'
import { ErrorBoundary } from '@/app/ErrorBoundary'

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<pre style="color:#fca5a5;padding:24px">#root not found</pre>'
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </StrictMode>,
  )
}

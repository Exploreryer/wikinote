import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LikedArticlesProvider } from './contexts/LikedArticlesContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LikedArticlesProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LikedArticlesProvider>
    </ErrorBoundary>
  </StrictMode>,
)

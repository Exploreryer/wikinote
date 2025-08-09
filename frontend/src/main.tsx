import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LikedArticlesProvider } from './contexts/LikedArticlesContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LikedArticlesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LikedArticlesProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)

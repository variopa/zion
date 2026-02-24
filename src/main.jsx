import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from '@/components/ErrorBoundary'

// Global Error Catch for non-React or early failures
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error:", message, "at", source, lineno, colno);
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Rejection:", event.reason);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>,
  )
} catch (error) {
  console.error("Critical Render Error:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;"><h1>Critical Boot Error</h1><pre>${error.stack}</pre></div>`;
}

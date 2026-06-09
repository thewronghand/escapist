import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import './index.css'
import { router } from '@/router'
import { ToastProvider } from '@/components/ui/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </JotaiProvider>
    </QueryClientProvider>
  </StrictMode>,
)

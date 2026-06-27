import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import './index.css'
import { router } from '@/router'
import { ToastProvider } from '@/components/ui/Toast'
import { initSentry, Sentry } from '@/lib/sentry'
import { trpc, createTrpcClient } from '@/lib/trpc'

initSentry()

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }))
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>문제가 발생했습니다. 페이지를 새로고침해주세요.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

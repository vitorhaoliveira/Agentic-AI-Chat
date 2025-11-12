import { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((module) => ({ default: module.ChatPage }))
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => !!s.token);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23] flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  );
}

function App() {
  // Create QueryClient only once using useMemo to avoid recreating on re-renders
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
    []
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

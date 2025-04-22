import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/ReservationsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { UserProvider } from './context/UserContext';
import { AlertProvider } from './context/AlertContext';
import { ReservationProvider } from './context/ReservationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <UserProvider>
            <AlertProvider>
              <ReservationProvider>
                <Routes>
                  {/* Main layout wrapper */}
                  <Route path="/" element={<Layout />}>
                    {/* Public routes - no authentication required */}
                    <Route element={<ProtectedRoute requireAuth={false} />}>
                      <Route index element={<HomePage />} />
                      <Route path="reservations" element={<ReservationsPage />} />
                      <Route path="reservations/:id" element={<ReservationDetailPage />} />
                      <Route path="reservations/:id/analytics" element={<AnalyticsPage />} />
                    </Route>

                    {/* Auth route - redirect to home if already authenticated */}
                    <Route element={<ProtectedRoute authOnly />}>
                      <Route path="/auth" element={<AuthPage />} />
                    </Route>

                    {/* Protected routes - require authentication but no specific role */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="alerts" element={<AlertsPage />} />
                    </Route>
                    
                    {/* Admin-only routes */}
                    <Route element={<RoleProtectedRoute requiredRole="admin" />}>
                      <Route path="admin" element={<AdminPage />} />
                    </Route>
                  </Route>
                </Routes>
              </ReservationProvider>
            </AlertProvider>
          </UserProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
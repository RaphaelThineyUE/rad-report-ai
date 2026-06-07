/**
 * Root application component. Wraps the entire app in QueryClient, ThemeProvider,
 * AuthProvider, and BrowserRouter. Defines top-level routes: public auth pages
 * (/login, /signup, /forgot-password, /reset-password) and a catch-all
 * ProtectedRoute that renders AppShell. AppShell owns the AppLayout and
 * lazy-loads all page-level route components via React.lazy + Suspense.
 */
import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import NotificationContainer from '@/components/notifications/NotificationContainer';

const Login        = lazy(() => import('@/pages/Login'));
const SignUp       = lazy(() => import('@/pages/SignUp'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('@/pages/ResetPassword'));
const Dashboard    = lazy(() => import('@/pages/Dashboard'));
const Worklist     = lazy(() => import('@/pages/Worklist'));
const Patients     = lazy(() => import('@/pages/Patients'));
const Analytics    = lazy(() => import('@/pages/Analytics'));
const PatientAnalytics = lazy(() => import('@/pages/PatientAnalytics'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminUsers   = lazy(() => import('@/pages/AdminUsers'));
const Settings     = lazy(() => import('@/pages/Settings'));
const Teams        = lazy(() => import('@/pages/Teams'));
const HowTo        = lazy(() => import('@/pages/HowTo'));

type NavId = 'dashboard' | 'worklist' | 'patients' | 'analytics' | 'patient-analytics' | 'admin-dashboard' | 'admin-users' | 'settings' | 'teams' | 'howto';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const active = (location.pathname.slice(1) || 'dashboard') as NavId;

  function handleNav(id: NavId) {
    setSearch('');
    navigate(`/${id}`);
  }

  return (
    <AppLayout active={active} onNav={handleNav} search={search} setSearch={setSearch}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/worklist"         element={<Worklist  search={search} />} />
          <Route path="/patients"         element={<Patients  search={search} />} />
          <Route path="/analytics"        element={<Analytics />} />
          <Route path="/patient-analytics" element={<PatientAnalytics />} />
          <Route path="/admin-dashboard"  element={<AdminDashboard />} />
          <Route path="/admin-users"      element={<AdminUsers />} />
          <Route path="/teams"            element={<Teams />} />
          <Route path="/howto"            element={<HowTo />} />
          <Route path="/settings"         element={<Settings />} />
          <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <NotificationContainer />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/login"             element={<Login />} />
                  <Route path="/signup"            element={<SignUp />} />
                  <Route path="/forgot-password"   element={<ForgotPassword />} />
                  <Route path="/reset-password"    element={<ResetPassword />} />
                  <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

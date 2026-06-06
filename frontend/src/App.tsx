import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

const Login        = lazy(() => import('@/pages/Login'));
const SignUp       = lazy(() => import('@/pages/SignUp'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('@/pages/ResetPassword'));
const Worklist     = lazy(() => import('@/pages/Worklist'));
const Patients     = lazy(() => import('@/pages/Patients'));
const Analytics    = lazy(() => import('@/pages/Analytics'));
const Settings     = lazy(() => import('@/pages/Settings'));
 

type NavId = 'worklist' | 'patients' | 'analytics' | 'admin-dashboard' | 'admin-users' | 'settings' | 'teams' | 'howto';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const active = (location.pathname.slice(1) || 'worklist') as NavId;

  function handleNav(id: NavId) {
    setSearch('');
    navigate(`/${id}`);
  }

  return (
    <AppLayout active={active} onNav={handleNav} search={search} setSearch={setSearch}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/worklist"  element={<Worklist  search={search} />} />
          <Route path="/patients"  element={<Patients  search={search} />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="*"          element={<Navigate to="/worklist" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

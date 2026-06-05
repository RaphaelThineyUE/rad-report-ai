import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Worklist from '@/pages/Worklist';
import Patients from '@/pages/Patients';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

type NavId = 'worklist' | 'patients' | 'analytics' | 'settings';

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
      <Routes>
        <Route path="/worklist"  element={<Worklist  search={search} />} />
        <Route path="/patients"  element={<Patients  search={search} />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="*"          element={<Navigate to="/worklist" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"             element={<Login />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />
            <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

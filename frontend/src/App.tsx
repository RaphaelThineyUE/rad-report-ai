import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Worklist from '@/pages/Worklist';
import Patients from '@/pages/Patients';
import Analytics from '@/pages/Analytics';
import PatientAnalytics from '@/pages/PatientAnalytics';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import Settings from '@/pages/Settings';
import Teams from '@/pages/Teams';
import HowTo from '@/pages/HowTo';

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
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login"             element={<Login />} />
              <Route path="/signup"            element={<SignUp />} />
              <Route path="/forgot-password"   element={<ForgotPassword />} />
              <Route path="/reset-password"    element={<ResetPassword />} />
              <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { HowToPage } from './pages/HowTo';
import { LayoutPage } from './pages/Layout';
import { LoginPage } from './pages/Login';
import { PatientAnalyticsPage } from './pages/PatientAnalytics';
import { PatientDetailPage } from './pages/PatientDetail';
import { PatientListPage } from './pages/PatientList';
import { useAuth } from './hooks/useAuth';
import { queryClient } from './store/queryClient';

const ProtectedRoutes = () => {
  const { token } = useAuth();
  return token ? <LayoutPage /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/analytics" element={<PatientAnalyticsPage />} />
            <Route path="/how-to" element={<HowToPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

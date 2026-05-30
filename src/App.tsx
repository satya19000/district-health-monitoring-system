import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/ui/Primitives';
import { defaultDashboard } from './lib/roles';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import Dashboard from './pages/dashboards/Dashboard';
import Uploads from './pages/Uploads';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

/** Sends an authenticated user to the best dashboard for their role. */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader label="Loading" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${defaultDashboard(user.role)}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Home → role default dashboard */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Dashboards (scope-gated) */}
      <Route
        path="/dashboard/state"
        element={<ProtectedRoute dashboard="state"><Dashboard scope="state" /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/district"
        element={<ProtectedRoute dashboard="district"><Dashboard scope="district" /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/programme"
        element={<ProtectedRoute dashboard="programme"><Dashboard scope="programme" /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/facility"
        element={<ProtectedRoute dashboard="facility"><Dashboard scope="facility" /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/anm"
        element={<ProtectedRoute dashboard="anm"><Dashboard scope="anm" /></ProtectedRoute>}
      />

      {/* Feature pages (capability-gated) */}
      <Route
        path="/uploads"
        element={<ProtectedRoute capability="upload_files"><Uploads /></ProtectedRoute>}
      />
      <Route
        path="/analysis"
        element={<ProtectedRoute capability="run_ai_analysis"><Analysis /></ProtectedRoute>}
      />
      <Route
        path="/reports"
        element={<ProtectedRoute capability="export_reports"><Reports /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute capability="manage_users"><Admin /></ProtectedRoute>}
      />

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

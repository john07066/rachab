import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

import Login from './pages/Login';
import SignUp from './pages/SignUp';

import Dashboard from './pages/Dashboard';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminManualEntry from './pages/AdminManualEntry';
import AdminScanner from './pages/AdminScanner';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="container flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && profile && !profile.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="container flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user && !profile) {
    // Edge case: user exists in Auth but profile generation completely failed / RLS blocked
    return <Navigate to="/dashboard" replace />;
  }

  if (profile?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="first-timers" element={<AdminMembers firstTimersOnly={true} />} />
            <Route path="manual" element={<AdminManualEntry />} />
            <Route path="scan" element={<AdminScanner />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

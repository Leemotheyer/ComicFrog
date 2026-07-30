import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AddPage from './pages/AddPage';
import EditPage from './pages/EditPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { configured, loading } = useAuth();
  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }
  if (!configured) {
    return <Navigate to="/settings" replace />;
  }
  return children;
}

function AppRoutes() {
  const [pullListCount, setPullListCount] = useState(0);

  return (
    <Routes>
      <Route element={<AppShell pullListCount={pullListCount} />}>
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <HomePage onStatsChange={(stats) => setPullListCount(stats.active)} />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/add"
          element={(
            <ProtectedRoute>
              <AddPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit/:source/:id"
          element={(
            <ProtectedRoute>
              <EditPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

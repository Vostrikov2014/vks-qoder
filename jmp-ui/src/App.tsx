import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConferencesPage from './pages/ConferencesPage';
import UsersPage from './pages/UsersPage';
import TenantsPage from './pages/TenantsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RecordingsPage from './pages/RecordingsPage';
import JoinPage from './pages/JoinPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Home Page - Accessible without authentication */}
        <Route path="/" element={<HomePage />} />

        {/* Public join link entry point: /j/<slug> resolves into a fresh Jitsi address */}
        <Route path="/j/:slug" element={<JoinPage />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />

        {/* Protected Routes - Require authentication */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="conferences" element={<ConferencesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="recordings" element={<RecordingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="tenants" element={<TenantsPage />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;

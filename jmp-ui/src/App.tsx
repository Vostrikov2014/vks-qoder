import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConferencesPage from './pages/ConferencesPage';
import UsersPage from './pages/UsersPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Home Page - Accessible without authentication */}
        <Route path="/" element={<HomePage />} />

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
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Video, Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authApi } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = response.data;

      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* Back to Home */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => navigate('/')}
          aria-label="Back to Home"
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            boxShadow: 'var(--shadow-lg)',
            '&:hover': {
              background: 'var(--glass-bg)',
              color: 'var(--text-h)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={22} />
        </IconButton>
      </Box>

      {/* Theme Toggle */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            boxShadow: 'var(--shadow-lg)',
            '&:hover': {
              background: 'var(--glass-bg)',
              color: 'var(--text-h)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 360 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
          </motion.div>
        </IconButton>
      </Box>

      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 182, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      {/* Login Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 420, zIndex: 1 }}
      >
        <Box
          sx={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl), 0 0 60px rgba(0, 0, 0, 0.08)',
            p: { xs: 3, sm: 5 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow Effect */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              left: -100,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 182, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Logo & Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #3b82b6 0%, #2563eb 50%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(59, 130, 182, 0.35)',
                  position: 'relative',
                }}
              >
                <Video size={36} color="white" />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #60a5fa, #3b82b6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={12} color="white" />
                </Box>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  color: 'var(--text-h)',
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
                Sign in to manage your video conferences
              </Typography>
            </Box>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#dc2626',
                  '& .MuiAlert-icon': {
                    color: '#ef4444',
                  },
                }}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} color="var(--text-muted)" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-elevated)',
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-strong)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82b6',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-muted)',
                    '&.Mui-focused': {
                      color: 'var(--text-h)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-h)',
                  },
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} color="var(--text-muted)" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-elevated)',
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-strong)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82b6',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-muted)',
                    '&.Mui-focused': {
                      color: 'var(--text-h)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-h)',
                  },
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#3b82b6',
                    cursor: 'pointer',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                fullWidth
                size="large"
                disabled={loading}
                endIcon={<ArrowRight size={20} />}
                sx={{
                  py: 1.5,
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #3b82b6 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(59, 130, 182, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 6px 25px rgba(59, 130, 182, 0.45)',
                  },
                  '&:disabled': {
                    background: 'var(--border-strong)',
                    color: 'var(--text-muted)',
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </Box>

          {/* Demo Credentials */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                mt: 4,
                p: 2.5,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(59, 130, 182, 0.06)',
                border: '1px dashed rgba(59, 130, 182, 0.25)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1.5,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Demo Credentials
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>Super Admin:</strong> admin@jmp.local / admin123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>Tenant Admin:</strong> tenant@jmp.local / tenant123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>Moderator:</strong> moderator@jmp.local / moderator123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>Participant:</strong> participant@jmp.local / participant123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>Auditor:</strong> auditor@jmp.local / auditor123
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}

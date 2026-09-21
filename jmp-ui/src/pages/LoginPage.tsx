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
import { Video, Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
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

// Shared styles for the email/password fields: no frame at all, the hint stays
// inside the field while it is empty, and hover uses the neutral grey tint of
// the HomePage tiles instead of a bluish one.
const createAuthFieldSx = (isDarkMode: boolean) => {
  // Single source of truth for the field surface; the autofill fill below
  // reuses it so a filled field keeps the exact background it had while empty
  const fieldSurface = isDarkMode ? 'var(--bg-elevated)' : '#f0f0f2';

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: 'var(--radius-lg)',
      // Light theme gets a minimal grey tint so the fields do not blend into the
      // white card; a filled field keeps it, just like the dark theme keeps its
      // own surface colour
      background: fieldSurface,
      transition: 'background-color 0.2s ease',
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      // Grey hover tint only while the field is still empty (hint visible),
      // same as --lp-tile-hover on HomePage
      '&:hover:has(.MuiOutlinedInput-input:placeholder-shown)': {
        background: isDarkMode ? '#2e2e33' : '#e4e4e7',
      },
      // No blue highlight on focus
      '&.Mui-focused fieldset': {
        border: 'none',
      },
      // The global autofill rule in index.css repaints autofilled inputs with
      // --bg-elevated (plain white in the light theme); pin the fill to the
      // field surface so autofilled credentials never change the background
      '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
        '-webkit-box-shadow': `0 0 0 1000px ${fieldSurface} inset !important`,
      },
    },
    '& .MuiOutlinedInput-input': {
      color: 'var(--text-h)',
    },
    // Hint is rendered inside the field and disappears once it is filled
    '& .MuiOutlinedInput-input::placeholder': {
      color: 'var(--text-muted)',
      opacity: 1,
    },
    // Grey colour change on hover
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-input::placeholder': {
      color: isDarkMode ? '#ffffff' : '#3f3f46',
    },
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const authFieldSx = createAuthFieldSx(isDarkMode);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

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
      setError(t('login.invalidCredentials'));
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
        background: isDarkMode ? '#000' : 'transparent',
      }}
    >
      {/* Left icon rail - same placement as on HomePage */}
      <Box
        component="nav"
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 88,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 2.5,
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => navigate('/')}
          aria-label={t('common.backToHome')}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            width: 64,
            p: '12px 4px',
            boxSizing: 'border-box',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: isDarkMode ? '#9a9aa0' : 'var(--text-muted)',
            fontFamily: 'inherit',
            '&:hover': {
              color: isDarkMode ? '#ffffff' : 'var(--primary-600)',
            },
            '&:hover .rail-tile': {
              background: isDarkMode ? '#2e2e33' : 'var(--bg-elevated)',
            },
            '&:focus-visible': {
              outline: '2px solid #4b7bec',
              outlineOffset: 2,
            },
          }}
        >
          <Box
            className="rail-tile"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: isDarkMode ? '#1a1a1d' : 'var(--glass-bg)',
              backdropFilter: isDarkMode ? 'none' : 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#ffffff' : 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            <ArrowLeft size={20} />
          </Box>
          <Box component="span" sx={{ fontSize: '0.6875rem', lineHeight: 1.2, textAlign: 'center' }}>
            {t('common.backToHome')}
          </Box>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            width: 64,
            p: '12px 4px',
            boxSizing: 'border-box',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: isDarkMode ? '#9a9aa0' : 'var(--text-muted)',
            fontFamily: 'inherit',
            '&:hover': {
              color: isDarkMode ? '#ffffff' : 'var(--primary-600)',
            },
            '&:hover .rail-tile': {
              background: isDarkMode ? '#2e2e33' : 'var(--bg-elevated)',
            },
            '&:focus-visible': {
              outline: '2px solid #4b7bec',
              outlineOffset: 2,
            },
          }}
        >
          <Box
            className="rail-tile"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: isDarkMode ? '#1a1a1d' : 'var(--glass-bg)',
              backdropFilter: isDarkMode ? 'none' : 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#ffffff' : 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDarkMode ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
          </Box>
          <Box component="span" sx={{ fontSize: '0.6875rem', lineHeight: 1.2, textAlign: 'center' }}>
            {t('home.theme')}
          </Box>
        </Box>

        {/* Spacer - pins the language button to the bottom, like .rail-spacer on HomePage */}
        <Box sx={{ flex: 1 }} />

        <Box
          component="button"
          type="button"
          onClick={toggleLanguage}
          aria-label={t('common.language')}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            width: 64,
            p: '12px 4px',
            boxSizing: 'border-box',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: isDarkMode ? '#9a9aa0' : 'var(--text-muted)',
            fontFamily: 'inherit',
            '&:hover': {
              color: isDarkMode ? '#ffffff' : 'var(--primary-600)',
            },
            '&:hover .rail-tile': {
              background: isDarkMode ? '#2e2e33' : 'var(--bg-elevated)',
            },
            '&:focus-visible': {
              outline: '2px solid #4b7bec',
              outlineOffset: 2,
            },
          }}
        >
          <Box
            className="rail-tile"
            sx={{
              width: 56,
              height: 36,
              borderRadius: '10px',
              background: isDarkMode ? '#1a1a1d' : 'var(--glass-bg)',
              backdropFilter: isDarkMode ? 'none' : 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: isDarkMode ? '#ffffff' : 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            {i18n.language === 'ru' ? 'EN' : 'RU'}
          </Box>
          <Box component="span" sx={{ fontSize: '0.6875rem', lineHeight: 1.2, textAlign: 'center' }}>
            {t('common.language')}
          </Box>
        </Box>
      </Box>

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
            borderRadius: '24px', // same corner radius as the HomePage tiles (--lp-radius)
            p: { xs: 3, sm: 5 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
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
                  background: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Video size={36} color="white" />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'var(--text-h)',
                }}
              >
                {t('login.welcomeBack')}
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
                placeholder={t('login.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                inputProps={{ 'aria-label': t('login.email') }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} color="var(--text-muted)" />
                    </InputAdornment>
                  ),
                }}
                sx={{ ...authFieldSx, mb: 2.5 }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <TextField
                fullWidth
                placeholder={t('login.password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputProps={{ 'aria-label': t('login.password') }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} color="var(--text-muted)" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        disableRipple
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ ...authFieldSx, mb: 1 }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--primary-600)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('login.forgotPassword')}
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                fullWidth
                size="large"
                disabled={loading}
                disableRipple
                endIcon={<ArrowRight size={20} />}
                sx={{
                  py: 1.5,
                  px: 3,
                  border: 'none',
                  outline: 'none',
                  // Match the corner radius of the email/password fields
                  borderRadius: 'var(--radius-lg)',
                  // Standard filled-button colours, same as the conferences page
                  background: 'var(--primary-600)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  transition: 'background-color var(--transition-base)',
                  '&:hover': {
                    background: 'var(--btn-hover-bg)',
                    outline: 'none',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                  },
                  '&:disabled': {
                    background: 'var(--border-strong)',
                    color: 'var(--text-muted)',
                    opacity: 0.5,
                  },
                }}
              >
                {loading ? t('login.signingIn') : t('login.signInButton')}
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
                background: 'rgba(var(--primary-rgb), 0.06)',
                border: '1px dashed rgba(var(--primary-rgb), 0.25)',
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
                {t('login.demoCredentials')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>{t('roles.SUPER_ADMIN')}:</strong> admin@jmp.local / admin123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>{t('roles.TENANT_ADMIN')}:</strong> tenant@jmp.local / tenant123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>{t('roles.MODERATOR')}:</strong> moderator@jmp.local / moderator123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>{t('roles.PARTICIPANT')}:</strong> participant@jmp.local / participant123
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
                  <strong>{t('roles.AUDITOR')}:</strong> auditor@jmp.local / auditor123
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}

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
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
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

// Corner radius shared by the email/password fields and the submit button,
// matching the tile rounding used across the app.
const AUTH_CONTROL_RADIUS = '16px';

// Shared styles for the email/password fields: fully frameless (no blue
// outline on focus), the hint stays inside the field while it is empty, and the
// field surface is filled on hover and focus - for empty and filled fields alike.
const createAuthFieldSx = (isDarkMode: boolean) => {
  // Field surfaces: idle and the single highlight used by both hover and focus
  // (a focused field must not look different from a hovered one). The light theme
  // uses a white surface with a pale primary tone so the highlight follows the blue
  // theme colour, the dark theme keeps matching the elevated surfaces
  const fieldSurface = isDarkMode ? 'var(--bg-elevated)' : '#ffffff';
  const highlightSurface = isDarkMode ? '#2e2e33' : 'var(--primary-100)';

  // Chrome paints autofilled inputs with its own background, which only an inset
  // shadow can cover: the fill is repeated per state, so autofilled (filled)
  // credentials keep showing the hover/focus highlight too. Naming the input
  // class raises the specificity above the global autofill rules of index.css,
  // including the html.dark ones.
  const autofillFill = (surface: string) => ({
    WebkitBoxShadow: `0 0 0 1000px ${surface} inset !important`,
  });

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: AUTH_CONTROL_RADIUS,
      background: fieldSurface,
      transition: 'background-color 0.2s ease',
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      // Background highlight on hover, no matter whether the field is filled
      '&:hover': {
        background: highlightSurface,
      },
      // No blue highlight on focus: the same fill marks the focused field
      '&.Mui-focused fieldset': {
        border: 'none',
      },
      '&.Mui-focused': {
        background: highlightSurface,
      },
      '& input.MuiOutlinedInput-input:-webkit-autofill': autofillFill(fieldSurface),
      '&:hover input.MuiOutlinedInput-input:-webkit-autofill, &.Mui-focused input.MuiOutlinedInput-input:-webkit-autofill':
        autofillFill(highlightSurface),
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

  // Plates of the left rail buttons (home / theme / language): same treatment as
  // the auth fields - a plain white surface that turns pale blue on hover, plus
  // the matching dark theme pair. The glyphs themselves keep the muted grey (white
  // in the dark theme): only the plate reacts to hover, hence the fixed tile colour
  const railTileBg = isDarkMode ? '#1a1a1d' : '#ffffff';
  const railTileHoverBg = isDarkMode ? '#2e2e33' : 'var(--primary-100)';
  const railTileColor = isDarkMode ? '#ffffff' : 'var(--text-muted)';

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
              background: railTileHoverBg,
            },
            '&:focus-visible': {
              outline: '2px solid #2563eb',
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
              background: railTileBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: railTileColor,
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
              background: railTileHoverBg,
            },
            '&:focus-visible': {
              outline: '2px solid #2563eb',
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
              background: railTileBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: railTileColor,
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
              background: railTileHoverBg,
            },
            '&:focus-visible': {
              outline: '2px solid #2563eb',
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
              background: railTileBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: railTileColor,
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

      {/* Login Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 420, zIndex: 1 }}
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1,
                color: 'var(--text-h)',
                fontSize: { sm: '2.5rem' },
              }}
            >
              {t('login.welcomeBack')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'var(--text-muted)', fontSize: { xs: '0.95rem', sm: '1.12rem' } }}
            >
              {t('login.credentialsHint')}
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
                // Pinned to the previous --radius-lg value (0.375rem): the shared
                // radius scale grew for the other pages, but this page must keep
                // its exact look
                borderRadius: '0.375rem',
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
                borderRadius: AUTH_CONTROL_RADIUS,
                // Same theme colours as the "Create conference" button on the Conferences page
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

        {/* SSO link placeholder, functionality to be added later */}
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
              {t('login.signInWithSso')}
            </Typography>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
}

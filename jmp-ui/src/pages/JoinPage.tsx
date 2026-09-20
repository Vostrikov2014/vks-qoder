import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { ArrowLeft, DoorOpen, Moon, Sun, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { extractApiError, joinApi } from '../services/api';
import type { JoinResult } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

type Phase = 'ask' | 'resolving' | 'redirecting' | 'blocked';

/** Machine-readable access verdicts mapped to localized messages. */
const REASON_KEYS: Record<string, string> = {
  link_not_found: 'join.reasons.linkNotFound',
  link_revoked: 'join.reasons.linkRevoked',
  link_expired: 'join.reasons.linkExpired',
  conference_cancelled: 'join.reasons.conferenceCancelled',
  conference_ended: 'join.reasons.conferenceEnded',
  not_assigned: 'join.reasons.notAssigned',
  assignment_declined: 'join.reasons.assignmentDeclined',
  assignment_removed: 'join.reasons.assignmentRemoved',
  domain_mismatch: 'join.reasons.domainMismatch',
  auth_required: 'join.reasons.authRequired',
  unknown_policy: 'join.reasons.unknownPolicy',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [phase, setPhase] = useState<Phase>('resolving');
  const [result, setResult] = useState<JoinResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const autoJoined = useRef(false);

  // The shared link resolves straight into Jitsi: no name is collected here, the Jitsi
  // prejoin screen prompts for it (the personal token carries no editable name).
  const enter = useCallback(async () => {
    if (!slug) return;
    try {
      setPhase('resolving');
      setFailure(null);
      const response = await joinApi.resolve(slug);
      const join = response.data;
      setResult(join);
      if (join.decision === 'REDIRECT' && join.roomUrl) {
        setPhase('redirecting');
        window.location.assign(join.roomUrl);
        return;
      }
      setPhase('blocked');
    } catch (err: unknown) {
      setResult(null);
      setFailure(extractApiError(err, t('join.requestFailed')));
      setPhase('blocked');
    }
  }, [slug, t]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Every visitor — signed-in or anonymous — is sent to the resolution immediately.
  useEffect(() => {
    if (autoJoined.current) return;
    autoJoined.current = true;
    enter();
  }, [enter]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
  };

  const blockedSeverity = result?.decision === 'LOGIN' ? 'info' : 'error';
  const blockedMessage = failure || (result ? (REASON_KEYS[result.reason] ? t(REASON_KEYS[result.reason]) : t('join.deniedDefault')) : t('join.deniedDefault'));
  const needsLogin = result?.decision === 'LOGIN';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      <div className="aurora-bg" />

      <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <IconButton
          onClick={() => navigate('/')}
          aria-label={t('common.backToHome')}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            '&:hover': { color: 'var(--primary-600)' },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={22} />
        </IconButton>
      </Box>

      <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10, display: 'flex', gap: 1 }}>
        <IconButton
          onClick={toggleLanguage}
          aria-label={t('common.language')}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600,
            '&:hover': { color: 'var(--primary-600)' },
            transition: 'all 0.2s ease',
          }}
        >
          {i18n.language === 'ru' ? 'EN' : 'RU'}
        </IconButton>
        <IconButton
          onClick={toggleTheme}
          aria-label={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            '&:hover': { color: 'var(--primary-600)' },
            transition: 'all 0.2s ease',
          }}
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </IconButton>
      </Box>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 440, zIndex: 1 }}
      >
        <Box
          sx={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl), 0 0 60px rgba(0, 0, 0, 0.08)',
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
          }}
        >
          <motion.div variants={itemVariants}>
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
                boxShadow: '0 8px 30px rgba(var(--primary-rgb), 0.35)',
              }}
            >
              {phase === 'blocked' ? <DoorOpen size={36} color="white" /> : <Video size={36} color="white" />}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: 'var(--text-h)' }}>
              {result?.conferenceName || t('common.conferences')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)', mb: 3 }}>
              {t('join.subtitle')}
            </Typography>
          </motion.div>

          {phase === 'blocked' && (
            <motion.div variants={itemVariants}>
              <Alert
                severity={blockedSeverity}
                sx={{
                  mb: 3,
                  textAlign: 'left',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-h)',
                  background: blockedSeverity === 'info' ? 'rgba(var(--primary-rgb), 0.16)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${blockedSeverity === 'info' ? 'rgba(var(--primary-rgb), 0.3)' : 'rgba(239, 68, 68, 0.25)'}`,
                  '& .MuiAlert-icon': { color: blockedSeverity === 'info' ? 'var(--primary-500)' : '#ef4444' },
                }}
              >
                {blockedMessage}
              </Alert>
            </motion.div>
          )}

          {phase === 'redirecting' && (
            <motion.div variants={itemVariants}>
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  textAlign: 'left',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  color: 'var(--text-h)',
                  '& .MuiAlert-icon': {
                    color: '#22c55e',
                  },
                }}
              >
                {t('join.redirecting')}
              </Alert>
            </motion.div>
          )}

          {(phase === 'ask' || phase === 'resolving') && (
            <motion.div variants={itemVariants}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  py: 2,
                }}
              >
                <CircularProgress size={36} sx={{ color: 'var(--primary-600)' }} />
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  {t('join.redirecting')}
                </Typography>
              </Box>
            </motion.div>
          )}

          {phase === 'blocked' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {needsLogin && !isAuthenticated && (
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 1.5,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary-600)',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { background: 'var(--primary-700)', boxShadow: '0 8px 25px rgba(var(--primary-rgb), 0.3)' },
                  }}
                >
                  {t('common.signIn')}
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => {
                  setResult(null);
                  setFailure(null);
                  autoJoined.current = true;
                  setPhase('resolving');
                  enter();
                }}
                sx={{
                  borderRadius: 'var(--radius-lg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  textTransform: 'none',
                }}
              >
                {t('join.retry')}
              </Button>
            </Box>
          )}

          <motion.div variants={itemVariants}>
            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'var(--text-muted)' }}>
              {t('join.poweredBy')}
            </Typography>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}

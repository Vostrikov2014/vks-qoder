import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Link2, User, ArrowRight, Sun, Moon, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { useThemeStore } from '../store/themeStore';
import { extractApiError, joinApi } from '../services/api';
import './HomePage.css';

/**
 * HomePage - Landing/Start page for VKS TV video conferencing application
 *
 * Features:
 * - Create instant meeting (no name prompt, no account, nothing is stored server-side;
 *   Jitsi's own prejoin screen asks for a name before joining)
 * - Join meeting via code/link
 * - Sign in for authenticated features
 */

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

// Base URL of the Jitsi Web instance; override via VITE_JITSI_URL in the environment
const JITSI_BASE_URL = import.meta.env.VITE_JITSI_URL || 'http://localhost:8000';

/**
 * URL fragments for immediate entry into a conference (mirrors the backend's
 * JitsiLinkBuilder.SKIP_PREJOIN_HASH, plus 'requireDisplayName' so anonymous guests
 * skip the name prompt too - Jitsi assigns a random nickname). Both keys are
 * whitelisted config overrides (jitsi-meet configWhitelist.ts).
 */
const JOIN_IMMEDIATE_HASH = '#config.prejoinConfig.enabled=false&config.requireDisplayName=false';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // State for the "Connect" card - controls visibility of the meeting code input
  const [isConnectExpanded, setIsConnectExpanded] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');

  // State for the "Create a Hangout" card: in-flight request + errors
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  /**
   * Asks the backend for a brand-new guest room and opens it in a new tab.
   *
   * No account and nothing stored: the room lives only inside Jitsi while somebody is
   * inside, and its address carries a server-signed short-lived token — Prosody runs
   * with AUTH_TYPE=jwt and refuses an anonymous XMPP login («connection.passwordRequired»).
   * No display name is sent: the Jitsi prejoin screen prompts for one and only then
   * connects, so the landing page never asks for it.
   */
  const handleCreateInstant = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError('');
    try {
      const { data } = await joinApi.createInstant();
      if (data.roomUrl) {
        window.open(data.roomUrl, '_blank', 'noopener');
      } else {
        setCreateError(t('home.createFailed'));
      }
    } catch (error) {
      setCreateError(extractApiError(error, t('home.createFailed')));
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Joins a meeting using the provided code or link
   *
   * @param code - The meeting code or full meeting URL
   */
  const joinMeeting = (code: string) => {
    if (!code.trim()) {
      return;
    }

    const trimmedCode = code.trim();

    // If it's a full URL (starts with http:// or https://), open it directly
    if (trimmedCode.startsWith('http://') || trimmedCode.startsWith('https://')) {
      window.open(trimmedCode, '_blank', 'noopener');
      return;
    }

    // If it's just a room code, construct the Jitsi URL (full URLs are opened as-is:
    // they may already carry their own query/hash, appending a second fragment would break them)
    const jitsiUrl = `${JITSI_BASE_URL}/${encodeURIComponent(trimmedCode)}${JOIN_IMMEDIATE_HASH}`;
    window.open(jitsiUrl, '_blank', 'noopener');
  };

  /**
   * Redirects to the login page for authenticated access
   */
  const redirectToLogin = () => {
    navigate('/login');
  };

  /**
   * Handles form submission for joining a meeting
   */
  const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    joinMeeting(meetingCode);
  };

  return (
    <div className="home-page">
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDarkMode ? 360 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </motion.div>
      </button>

      {/* Language Toggle */}
      <button
        className="language-toggle"
        onClick={toggleLanguage}
        aria-label={t('common.language')}
      >
        {i18n.language === 'ru' ? 'EN' : 'RU'}
      </button>

      {/* Decorative Elements */}
      <div className="decorative-blob blob-top-left" />
      <div className="decorative-blob blob-bottom-right" />

      {/* Main Content */}
      <motion.main
        className="home-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo Section */}
        <motion.header className="home-header" variants={itemVariants}>
          <div className="logo-container">
            <div className="logo-icon">
              <Video size={32} />
            </div>
            <h1 className="logo-text">VKS TV</h1>
          </div>
          <p className="tagline">{t('home.tagline')}</p>
        </motion.header>

        {/* Action Cards Grid */}
        <motion.div className="cards-grid" variants={itemVariants}>
          {/* Card 1: Create a Hangout (Instant Meeting) — one click starts the room,
              the name is entered on the Jitsi prejoin screen */}
          <motion.div className="action-card connect-card" variants={cardVariants} layout>
            <button
              className="card-button"
              onClick={handleCreateInstant}
              disabled={isCreating}
              aria-label={t('home.createHangoutAria')}
            >
              <div className="card-icon create-icon">
                <Video size={28} />
              </div>
              <h2 className="card-title">{t('home.createHangout')}</h2>
              <p className="card-description">
                {t('home.createHangoutDesc')}
              </p>
              <div className="card-arrow">
                {isCreating ? <LoaderCircle size={20} className="spinning" /> : <ArrowRight size={20} />}
              </div>
            </button>
          </motion.div>

          {/* Card 2: Connect (Join Meeting) */}
          <motion.div
            className={`action-card connect-card ${isConnectExpanded ? 'expanded' : ''}`}
            variants={cardVariants}
            layout
          >
            <button
              className="card-button"
              onClick={() => setIsConnectExpanded(!isConnectExpanded)}
              aria-expanded={isConnectExpanded}
              aria-label={t('home.connectAria')}
            >
              <div className="card-icon connect-icon">
                <Link2 size={28} />
              </div>
              <h2 className="card-title">{t('home.connect')}</h2>
              <p className="card-description">
                {t('home.connectDesc')}
              </p>
              <div className={`card-arrow ${isConnectExpanded ? 'rotated' : ''}`}>
                <ArrowRight size={20} />
              </div>
            </button>

            {/* Expandable Input Section */}
            <AnimatePresence>
              {isConnectExpanded && (
                <motion.form
                  className="connect-form"
                  onSubmit={handleJoinSubmit}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="input-group">
                    <input
                      type="text"
                      className="meeting-input"
                      placeholder={t('home.enterMeetingCode')}
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      autoFocus
                      aria-label={t('home.enterMeetingCode')}
                    />
                    <button
                      type="submit"
                      className="join-button"
                      disabled={!meetingCode.trim()}
                      aria-label={t('common.join')}
                    >
                      {t('common.join')}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 3: Sign In */}
          <motion.button
            className="action-card"
            variants={cardVariants}
            onClick={redirectToLogin}
            whileHover={{ boxShadow: 'var(--shadow-xl)' }}
            aria-label={t('home.signInAria')}
          >
            <div className="card-icon signin-icon">
              <User size={28} />
            </div>
            <h2 className="card-title">{t('common.signIn')}</h2>
            <p className="card-description">
              {t('home.signInDesc')}
            </p>
            <div className="card-arrow">
              <ArrowRight size={20} />
            </div>
          </motion.button>
        </motion.div>

        {/* Backend errors of the "Create a Hangout" card */}
        <AnimatePresence>
          {createError && (
            <motion.p
              className="create-error"
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {createError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer className="home-footer" variants={itemVariants}>
          <p>{t('home.footer')}</p>
        </motion.footer>
      </motion.main>
    </div>
  );
}

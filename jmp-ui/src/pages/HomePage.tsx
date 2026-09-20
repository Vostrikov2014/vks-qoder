import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Clock, ArrowRight, LogIn, Sun, Moon, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { extractApiError, joinApi } from '../services/api';
import './HomePage.css';

/**
 * HomePage - Landing/Start page for VKS TV video conferencing application
 *
 * Layout mirrors the corporate "start screen" design:
 * - left icon rail (sign in / meetings / theme / language)
 * - 2x2 action grid: big blue "create meeting" tile, "schedule" tile,
 *   "connect by code" tile (expands inline), "sign in" tile
 * - right hero: call-to-action for authenticated users + decorative line-art SVG
 *
 * Features kept from the previous design:
 * - Create instant meeting (no name prompt, no account; Jitsi's prejoin asks for a name)
 * - Join meeting via code/link
 * - Sign in for authenticated features
 */

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
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

/**
 * HeroHills - decorative line-art illustration (lock / video / servers / shield
 * connected by routes with gradient "sparkles"), pure SVG, no interactivity.
 */
const HeroIllustration = () => (
  <svg
    className="hero-illustration"
    viewBox="0 0 520 520"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="sparkle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Connection routes between the icons */}
    <g stroke="rgba(255,255,255,0.28)" strokeWidth="2">
      <path d="M150 130 V215 H95 V410" />
      <path d="M150 130 H400 V215" />
      <path d="M400 315 V465 H330" />
      <path d="M95 300 H280" />
    </g>
    <circle cx="330" cy="330" r="62" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />

    {/* Padlock */}
    <g>
      <rect x="110" y="150" width="80" height="80" rx="18" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M137 186 v-9 a13 13 0 0 1 26 0 v9"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="131" y="186" width="38" height="28" rx="7" stroke="#ffffff" strokeWidth="3" />
      <circle cx="150" cy="200" r="4" fill="#ffffff" />
    </g>

    {/* Video camera */}
    <g>
      <rect x="355" y="215" width="120" height="100" rx="24" stroke="#ffffff" strokeWidth="3" />
      <rect x="379" y="243" width="50" height="44" rx="12" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M441 253 l24 -12 v46 l-24 -12 z"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>

    {/* Server stack */}
    <g stroke="#ffffff" strokeWidth="3">
      <rect x="55" y="255" width="150" height="42" rx="10" />
      <rect x="55" y="310" width="150" height="42" rx="10" />
      <rect x="55" y="365" width="150" height="42" rx="10" />
    </g>
    <g fill="#ffffff">
      <circle cx="178" cy="276" r="3.5" />
      <circle cx="191" cy="276" r="3.5" />
      <circle cx="178" cy="331" r="3.5" />
      <circle cx="191" cy="331" r="3.5" />
      <circle cx="178" cy="386" r="3.5" />
      <circle cx="191" cy="386" r="3.5" />
    </g>

    {/* Security shield */}
    <g>
      <rect x="330" y="405" width="90" height="90" rx="20" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M375 424 l24 9 v19 c0 15 -10 25 -24 31 c-14 -6 -24 -16 -24 -31 v-19 z"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M366 456 l7 7 l14 -14"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

    {/* Sparkles */}
    <path
      d="M290 24 C294 74 306 86 356 90 C306 94 294 106 290 156 C286 106 274 94 224 90 C274 86 286 74 290 24 Z"
      fill="url(#sparkle)"
    />
    <path
      d="M465 368 C467 396 475 404 503 406 C475 408 467 416 465 444 C463 416 455 408 427 406 C455 404 463 396 465 368 Z"
      fill="url(#sparkle)"
    />
    <path
      d="M185 470 C186 486 190 490 206 491 C190 492 186 496 185 512 C184 496 180 492 164 491 C180 490 184 486 185 470 Z"
      fill="url(#sparkle)"
    />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

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

  // State for the "Connect" tile - controls visibility of the meeting code input
  const [isConnectExpanded, setIsConnectExpanded] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');

  // State of the in-flight "create instant meeting" request + errors
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  /**
   * Asks the backend for a brand-new guest room and opens it in a new tab.
   *
   * No account and nothing stored: the room lives only inside Jitsi while somebody is
   * inside, and its address carries a server-signed short-lived token — Prosody runs
   * with AUTH_TYPE=jwt and refuses an anonymous XMPP login («connection.passwordRequired»).
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
   * "Meetings / Schedule": conferences live behind authentication,
   * so authenticated users land on the conferences list, guests on the login page
   */
  const handleMeetings = () => {
    navigate(isAuthenticated ? '/dashboard/conferences' : '/login');
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
      {/* Aurora overlay - same as on the login page (styles come from index.css) */}
      <div className="aurora-bg" />

      {/* Left icon rail */}
      <aside className="home-rail">
        <button
          className="rail-item"
          onClick={redirectToLogin}
          aria-label={t('home.signInAria')}
        >
          <span className="rail-icon">
            <LogIn size={20} />
          </span>
          <span className="rail-label">{t('home.signInShort')}</span>
        </button>

        <button
          className="rail-item"
          onClick={handleMeetings}
          aria-label={t('home.meetingsAria')}
        >
          <span className="rail-icon">
            <Video size={20} />
          </span>
          <span className="rail-label">{t('home.meetings')}</span>
        </button>

        <button
          className="rail-item"
          onClick={toggleTheme}
          aria-label={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
        >
          <span className="rail-icon">
            <motion.span
              className="rail-icon-inner"
              initial={false}
              animate={{ rotate: isDarkMode ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.span>
          </span>
          <span className="rail-label">{t('home.theme')}</span>
        </button>

        <div className="rail-spacer" />

        <button
          className="rail-item language-item"
          onClick={toggleLanguage}
          aria-label={t('common.language')}
        >
          <span className="rail-label">{i18n.language === 'ru' ? 'EN' : 'RU'}</span>
        </button>
      </aside>

      {/* Main area */}
      <div className="home-main">
        <motion.header className="home-header" variants={itemVariants} initial="hidden" animate="visible">
          <span className="brand-name">{t('common.appName')}</span>
          <span className="brand-tagline">{t('home.brandTagline')}</span>
        </motion.header>

        <div className="home-body">
          {/* Action tiles */}
          <motion.main
            className="cards-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tile 1: Create an instant meeting (primary, one click) */}
            <motion.button
              type="button"
              className="tile tile-primary"
              variants={itemVariants}
              whileTap={{ scale: 0.99 }}
              onClick={handleCreateInstant}
              disabled={isCreating}
              aria-label={t('home.createHangoutAria')}
            >
              <span className="tile-icon">
                {isCreating ? (
                  <motion.span
                    className="rail-icon-inner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <LoaderCircle size={140} strokeWidth={1} />
                  </motion.span>
                ) : (
                  <Video size={140} strokeWidth={1} />
                )}
              </span>
              <span className="tile-title">{t('home.createMeeting')}</span>
            </motion.button>

            {/* Tile 2: Meetings list / scheduling (requires an account) */}
            <motion.button
              type="button"
              className="tile tile-dark"
              variants={itemVariants}
              whileTap={{ scale: 0.99 }}
              onClick={handleMeetings}
              aria-label={t('home.meetingsAria')}
            >
              <span className="tile-icon tile-icon-accent">
                <Clock size={52} strokeWidth={1.8} />
              </span>
              <span className="tile-title">{t('home.scheduleMeeting')}</span>
              <span className="tile-subtitle">{t('home.scheduleMeetingDesc')}</span>
            </motion.button>

            {/* Tile 3: Connect by code or link (expands inline) */}
            <motion.div
              className={`tile tile-dark tile-connect ${isConnectExpanded ? 'expanded' : ''}`}
              variants={itemVariants}
            >
              <button
                type="button"
                className="tile-button"
                onClick={() => setIsConnectExpanded(!isConnectExpanded)}
                aria-expanded={isConnectExpanded}
                aria-label={t('home.connectAria')}
              >
                <span className="tile-icon tile-icon-arrow">
                  <ArrowRight size={52} strokeWidth={1.8} />
                </span>
                <span className="tile-title">{t('home.connect')}</span>
              </button>

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
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Backend errors of the "create meeting" tile */}
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
          </motion.main>

          {/* Right hero: sign-in call to action + line-art illustration */}
          <motion.aside
            className="hero-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className="hero-title" variants={itemVariants}>
              {t('home.heroTitle')}
              <span className="hero-title-accent">{t('home.heroTitleAccent')}</span>
              {t('home.heroTitleSuffix')}
            </motion.h1>

            <motion.button
              type="button"
              className="hero-cta"
              variants={itemVariants}
              onClick={redirectToLogin}
              aria-label={t('home.signInAria')}
            >
              {t('home.signInAsEmployee')}
            </motion.button>

            <motion.div className="hero-art" variants={itemVariants}>
              <HeroIllustration />
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

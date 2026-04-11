import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Link2, User, ArrowRight, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import './HomePage.css';

/**
 * HomePage - Landing/Start page for VKS TV video conferencing application
 *
 * Features:
 * - Create instant meeting (no auth required)
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

export default function HomePage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();

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

  /**
   * Generates a unique room ID and opens Jitsi Web in a new tab
   * This is client-side only - no authentication required
   */
  const generateRoomAndRedirect = () => {
    // Generate a unique room ID with 'vks-' prefix + random alphanumeric string
    const randomStr = Math.random().toString(36).substring(2, 10);
    const roomId = `vks-${randomStr}`;

    // Open Jitsi Web in a new tab
    const jitsiUrl = `http://localhost:8000/${roomId}`;
    window.open(jitsiUrl, '_blank');
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
      window.open(trimmedCode, '_blank');
      return;
    }

    // If it's just a room code, construct the Jitsi URL
    const jitsiUrl = `http://localhost:8000/${trimmedCode}`;
    window.open(jitsiUrl, '_blank');
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
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDarkMode ? 360 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
        </motion.div>
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
          <p className="tagline">Professional video conferencing made simple</p>
        </motion.header>

        {/* Action Cards Grid */}
        <motion.div className="cards-grid" variants={itemVariants}>
          {/* Card 1: Create a Hangout (Instant Meeting) */}
          <motion.button
            className="action-card"
            variants={cardVariants}
            onClick={generateRoomAndRedirect}
            whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
            whileTap={{ scale: 0.98 }}
            aria-label="Create an instant meeting"
          >
            <div className="card-icon create-icon">
              <Video size={28} />
            </div>
            <h2 className="card-title">Create a Hangout</h2>
            <p className="card-description">
              Start an instant conference. No login required.
            </p>
            <div className="card-arrow">
              <ArrowRight size={20} />
            </div>
          </motion.button>

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
              aria-label="Connect to a meeting"
            >
              <div className="card-icon connect-icon">
                <Link2 size={28} />
              </div>
              <h2 className="card-title">Connect</h2>
              <p className="card-description">
                Enter a meeting code or link to connect.
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
                      placeholder="Enter meeting code or link"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      autoFocus
                      aria-label="Meeting code or link"
                    />
                    <button
                      type="submit"
                      className="join-button"
                      disabled={!meetingCode.trim()}
                      aria-label="Join meeting"
                    >
                      Join
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
            whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
            whileTap={{ scale: 0.98 }}
            aria-label="Sign in to your account"
          >
            <div className="card-icon signin-icon">
              <User size={28} />
            </div>
            <h2 className="card-title">Sign In</h2>
            <p className="card-description">
              Access your account, schedule meetings, and manage preferences.
            </p>
            <div className="card-arrow">
              <ArrowRight size={20} />
            </div>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.footer className="home-footer" variants={itemVariants}>
          <p>Secure, reliable video conferencing for teams of all sizes</p>
        </motion.footer>
      </motion.main>
    </div>
  );
}

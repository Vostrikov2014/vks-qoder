import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Video,
  Users,
  Calendar,
  HardDrive,
  TrendingUp,
  Activity,
  Cpu,
  MemoryStick,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { conferenceApi, analyticsApi, type DashboardMetrics, type SystemHealthMetrics } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface DashboardStats {
  activeConferences: number;
  upcomingConferences: number;
  totalParticipants: number;
  totalRecordings: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

// Bento Card Component
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  colSpan?: number;
  rowSpan?: number;
}

const BentoCard = ({ children, gradient, colSpan = 1, rowSpan = 1 }: BentoCardProps) => (
  <motion.div
    variants={itemVariants}
    className="bento-card"
    style={{
      gridColumn: `span ${colSpan}`,
      gridRow: `span ${rowSpan}`,
    }}
  >
    <Box
      sx={{
        height: '100%',
        background: gradient || 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 'var(--shadow-xl)',
        },
      }}
    >
      {children}
    </Box>
  </motion.div>
);

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  bgGradient?: string;
  locale?: string;
}

const StatCard = ({ title, value, icon, trend, color, bgGradient, locale = 'en-US' }: StatCardProps) => (
  <BentoCard gradient={bgGradient}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        {icon}
      </Box>
      {trend !== undefined && (
        <Chip
          size="small"
          icon={trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          label={`${Math.abs(trend)}%`}
          sx={{
            background: trend >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: trend >= 0 ? '#16a34a' : '#dc2626',
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      )}
    </Box>
    <Typography variant="h3" sx={{ fontWeight: 700, color: 'var(--text-h)', mb: 0.5 }}>
      {value.toLocaleString(locale)}
    </Typography>
    <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
      {title}
    </Typography>
  </BentoCard>
);

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.some(
    (role) => role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_TENANT_ADMIN'
  ) ?? false;
  const canManageConferences = user?.roles?.some(
    (role) => role === 'ROLE_MODERATOR' || role === 'ROLE_TENANT_ADMIN' || role === 'ROLE_SUPER_ADMIN'
  ) ?? false;

  const [stats, setStats] = useState<DashboardStats>({
    activeConferences: 0,
    upcomingConferences: 0,
    totalParticipants: 0,
    totalRecordings: 0,
  });
  const [, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, upcomingRes] = await Promise.all([
          conferenceApi.getActiveConferences(),
          conferenceApi.getUpcomingConferences(),
        ]);

        const activeConferences = activeRes.data.length;
        const upcomingConferences = upcomingRes.data.length;
        const totalParticipants = activeRes.data.reduce(
          (sum: number, conf: { currentParticipants?: number }) =>
            sum + (conf.currentParticipants || 0),
          0
        );

        setStats({
          activeConferences,
          upcomingConferences,
          totalParticipants,
          totalRecordings: 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const metricsRes = await analyticsApi.getDashboardMetrics();
        setDashboardMetrics(metricsRes.data);

        if (isAdmin) {
          const healthRes = await analyticsApi.getSystemHealth();
          setSystemHealth(healthRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAdmin]);

  const getProgressColor = (value: number): string => {
    if (value < 60) return '#22c55e';
    if (value <= 80) return '#3b82b6';
    return '#ef4444';
  };



  const chartData = dashboardMetrics?.weeklyUsage?.map((item) => ({
    date: item.date,
    conferences: item.conferences,
    participants: item.participants,
  })) || [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)', mb: 1 }}>
            {t('dashboard.overview')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
            {t('dashboard.overviewDesc')}
          </Typography>
        </Box>
      </motion.div>

      {/* Bento Grid Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <StatCard
          title={t('dashboard.activeConferences')}
          value={stats.activeConferences}
          icon={<Video size={24} />}
          trend={12}
          color="#3b82b6"
          locale={i18n.language === 'ru' ? 'ru-RU' : 'en-US'}
        />
        <StatCard
          title={t('dashboard.upcoming')}
          value={stats.upcomingConferences}
          icon={<Calendar size={24} />}
          trend={8}
          color="#60a5fa"
          locale={i18n.language === 'ru' ? 'ru-RU' : 'en-US'}
        />
        <StatCard
          title={t('dashboard.activeParticipants')}
          value={stats.totalParticipants}
          icon={<Users size={24} />}
          trend={-3}
          color="#2563eb"
          locale={i18n.language === 'ru' ? 'ru-RU' : 'en-US'}
        />
        <StatCard
          title={t('dashboard.recordings')}
          value={dashboardMetrics?.recordingsThisMonth || 0}
          icon={<HardDrive size={24} />}
          trend={24}
          color="#1d4ed8"
          locale={i18n.language === 'ru' ? 'ru-RU' : 'en-US'}
        />
      </Box>

      {/* Charts & System Health Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Usage Chart */}
        <BentoCard colSpan={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 0.5 }}>
                {t('dashboard.weeklyUsageTrends')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                {t('dashboard.weeklyUsageDesc')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                size="small"
                icon={<TrendingUp size={14} />}
                label={t('common.live')}
                sx={{
                  background: 'rgba(59, 130, 182, 0.15)',
                  color: '#2563eb',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
          <Box sx={{ height: 280 }}>
            {analyticsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity size={32} color="var(--text-muted)" />
                </motion.div>
              </Box>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConferences" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conferences"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConferences)"
                    name={t('dashboard.conferencesSeries')}
                  />
                  <Area
                    type="monotone"
                    dataKey="participants"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorParticipants)"
                    name={t('dashboard.participantsSeries')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  {t('dashboard.noDataAvailable')}
                </Typography>
              </Box>
            )}
          </Box>
        </BentoCard>

        {/* System Health */}
        {isAdmin && (
          <BentoCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                {t('dashboard.systemHealth')}
              </Typography>
              <IconButton sx={{ color: 'var(--text-muted)' }}>
                <MoreHorizontal size={20} />
              </IconButton>
            </Box>
            {analyticsLoading || !systemHealth ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity size={32} color="var(--text-muted)" />
                </motion.div>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* CPU */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Cpu size={18} color="#3b82b6" />
                      <Typography variant="body2" sx={{ color: 'var(--text)' }}>
                        {t('dashboard.cpuUsage')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                      {systemHealth.cpuUsage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.cpuUsage}
                    sx={{
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(systemHealth.cpuUsage),
                        borderRadius: 'var(--radius-full)',
                      },
                    }}
                  />
                </Box>

                {/* Memory */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MemoryStick size={18} color="#60a5fa" />
                      <Typography variant="body2" sx={{ color: 'var(--text)' }}>
                        {t('dashboard.memoryUsage')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                      {systemHealth.memoryUsage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.memoryUsage}
                    sx={{
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(96, 165, 250, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(systemHealth.memoryUsage),
                        borderRadius: 'var(--radius-full)',
                      },
                    }}
                  />
                </Box>

                {/* Stats Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(59, 130, 246, 0.08)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                      {t('dashboard.activeConnections')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82b6' }}>
                      {systemHealth.activeConnections}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(96, 165, 250, 0.08)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                      {t('dashboard.avgResponse')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#60a5fa' }}>
                      {systemHealth.averageResponseTime}ms
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </BentoCard>
        )}
      </Box>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 2 }}>
            {t('dashboard.quickActions')}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {[
            { label: t('dashboard.startConference'), icon: <Video size={20} />, color: '#3b82b6', path: '/conferences', requiresConferenceAccess: true },
            { label: t('dashboard.viewRecordings'), icon: <HardDrive size={20} />, color: '#2563eb', path: '/recordings' },
            { label: t('dashboard.manageUsers'), icon: <Users size={20} />, color: '#1d4ed8', path: '/users', requiresAdmin: true },
            { label: t('dashboard.viewReports'), icon: <TrendingUp size={20} />, color: '#60a5fa', path: '/analytics' },
          ]
            .filter((action) => {
              if (action.requiresAdmin) return isAdmin;
              if (action.requiresConferenceAccess) return canManageConferences;
              return true;
            })
            .map((action) => (
            <Button
              key={action.label}
              variant="outlined"
              onClick={() => navigate(action.path)}
              startIcon={action.icon}
              sx={{
                py: 2,
                px: 3,
                justifyContent: 'flex-start',
                borderRadius: 'var(--radius-xl)',
                borderColor: `${action.color}30`,
                color: action.color,
                background: `${action.color}08`,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: action.color,
                  background: `${action.color}15`,
                },
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </motion.div>
    </motion.div>
  );
}

// IconButton component for the dashboard
function IconButton({ children, sx, ...props }: any) {
  return (
    <Box
      component="button"
      sx={{
        p: 1,
        borderRadius: 'var(--radius-lg)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        '&:hover': {
          background: 'rgba(148, 163, 184, 0.1)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

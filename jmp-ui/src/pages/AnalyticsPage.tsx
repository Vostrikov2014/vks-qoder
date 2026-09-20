import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Video,
  Users,
  Clock,
  HardDrive,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi, type DashboardMetrics, type UsageReport, type ParticipantAnalytics, type RecordingAnalytics } from '../services/api';
import { useAuthStore } from '../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const PIE_COLORS = ['var(--primary-400)', 'var(--primary-600)', 'var(--primary-500)', 'var(--primary-700)', '#6b7280'];

const BentoCard = ({ children, colSpan = 1 }: { children: React.ReactNode; colSpan?: number }) => (
  <motion.div
    variants={itemVariants}
    style={{ gridColumn: `span ${colSpan}` }}
  >
    <Box
      sx={{
        height: '100%',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: 'var(--shadow-xl)',
        },
      }}
    >
      {children}
    </Box>
  </motion.div>
);

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatDurationHuman = (seconds: number, t: (key: string) => string): string => {
  if (seconds === 0) return `0 ${t('analytics.minutes')}`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ${t('analytics.hours')} ${mins} ${t('analytics.minutes')}`;
  }
  return `${mins} ${t('analytics.minutes')}`;
};

// datetime-local shows local wall-clock time, so a UTC slice would shift the value
const toDateTimeLocalValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// datetime-local value -> ISO instant the backend can parse
const toInstant = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export default function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canViewAnalytics = user?.roles?.some(
    (role) => role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_TENANT_ADMIN' || role === 'ROLE_AUDITOR'
  ) ?? false;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [usageReport, setUsageReport] = useState<UsageReport | null>(null);
  const [participantData, setParticipantData] = useState<ParticipantAnalytics | null>(null);
  const [recordingData, setRecordingData] = useState<RecordingAnalytics | null>(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateTimeLocalValue(d);
  });
  const [endDate, setEndDate] = useState(() => toDateTimeLocalValue(new Date()));

  const fetchData = useCallback(async () => {
    if (!canViewAnalytics) {
      setLoading(false);
      return;
    }
    const startInstant = toInstant(startDate);
    const endInstant = toInstant(endDate);
    if (!startInstant || !endInstant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [metricsRes, usageRes, participantRes, recordingRes] = await Promise.all([
        analyticsApi.getDashboardMetrics(),
        analyticsApi.getUsageReport(startInstant, endInstant),
        analyticsApi.getParticipantAnalytics(startInstant, endInstant),
        analyticsApi.getRecordingAnalytics(startInstant, endInstant),
      ]);
      setMetrics(metricsRes.data);
      setUsageReport(usageRes.data);
      setParticipantData(participantRes.data);
      setRecordingData(recordingRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [canViewAnalytics, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Redirect if no access
  useEffect(() => {
    if (!canViewAnalytics && !loading) {
      navigate('/dashboard');
    }
  }, [canViewAnalytics, loading, navigate]);

  const handlePreset = (preset: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    const start = new Date();
    switch (preset) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
    }
    setStartDate(toDateTimeLocalValue(start));
    setEndDate(toDateTimeLocalValue(now));
  };

  // Prepare chart data
  const trendData = participantData?.participantTrend
    ? Object.entries(participantData.participantTrend)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
            month: 'short',
            day: 'numeric',
          }),
          participants: count,
        }))
    : [];

  const recordingTypeData = recordingData?.recordingsByType
    ? Object.entries(recordingData.recordingsByType).map(([type, count]) => ({
        name: t(`recordings.${type}`),
        value: count,
      }))
    : [];

  const durationData = metrics?.durationStats
    ? [
        { name: t('analytics.minDuration'), value: metrics.durationStats.shortestConference },
        { name: t('analytics.avgDuration'), value: metrics.durationStats.averageDuration },
        { name: t('analytics.maxDuration'), value: metrics.durationStats.longestConference },
      ]
    : [];

  // Compute trend percentages from weeklyUsage
  const computeTrend = (key: 'conferences' | 'participants' | 'recordings'): number | undefined => {
    if (!metrics?.weeklyUsage || metrics.weeklyUsage.length < 2) return undefined;
    const mid = Math.floor(metrics.weeklyUsage.length / 2);
    const prev = metrics.weeklyUsage.slice(0, mid);
    const curr = metrics.weeklyUsage.slice(mid);
    const prevSum = prev.reduce((sum, d) => sum + d[key], 0);
    const currSum = curr.reduce((sum, d) => sum + d[key], 0);
    if (prevSum === 0) return currSum > 0 ? 100 : 0;
    return Math.round(((currSum - prevSum) / prevSum) * 100);
  };

  if (!canViewAnalytics) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Period Filter */}
      <motion.div variants={itemVariants}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
            alignItems: 'center',
          }}
        >
          <TextField
            type="datetime-local"
            size="small"
            label={t('analytics.startDate')}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                background: 'var(--glass-bg)',
                color: 'var(--text-h)',
                '& fieldset': { borderColor: 'var(--border)' },
                '&:hover fieldset': { borderColor: 'var(--border)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-600)' },
              },
              '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary-600)' },
            }}
          />
          <TextField
            type="datetime-local"
            size="small"
            label={t('analytics.endDate')}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                background: 'var(--glass-bg)',
                color: 'var(--text-h)',
                '& fieldset': { borderColor: 'var(--border)' },
                '&:hover fieldset': { borderColor: 'var(--border)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-600)' },
              },
              '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary-600)' },
            }}
          />
          <Button
            variant="contained"
            onClick={fetchData}
            sx={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-600)',
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: 'var(--primary-700)', boxShadow: 'none' },
            }}
          >
            {t('common.apply')}
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['week', 'month', 'quarter'] as const).map((preset) => (
              <Chip
                key={preset}
                label={t(`common.${preset}`)}
                clickable
                onClick={() => handlePreset(preset)}
                sx={{
                  fontWeight: 600,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(var(--primary-rgb), 0.12)',
                  color: 'var(--primary-600)',
                  '&:hover': { background: 'rgba(var(--primary-rgb), 0.25)' },
                }}
              />
            ))}
          </Box>
        </Box>
      </motion.div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--primary-600)' }} />
        </Box>
      ) : (
        <>
          {/* KPI Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                  <Video size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {usageReport?.totalConferences ?? metrics?.activeConferences ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.totalConferences')}</Typography>
                </Box>
                {computeTrend('conferences') !== undefined && (
                  <Chip
                    size="small"
                    icon={computeTrend('conferences')! >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} />}
                    label={`${Math.abs(computeTrend('conferences')!)}%`}
                    sx={{
                      background: computeTrend('conferences')! >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: computeTrend('conferences')! >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
              </Box>
            </BentoCard>

            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-500-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)' }}>
                  <Users size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {usageReport?.totalParticipants ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.totalParticipants')}</Typography>
                </Box>
                {computeTrend('participants') !== undefined && (
                  <Chip
                    size="small"
                    icon={<TrendingUp size={14} />}
                    label={`${Math.abs(computeTrend('participants')!)}%`}
                    sx={{
                      background: computeTrend('participants')! >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: computeTrend('participants')! >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
              </Box>
            </BentoCard>

            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                  <Clock size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {usageReport?.totalDurationMinutes
                      ? formatDurationHuman(usageReport.totalDurationMinutes * 60, t)
                      : formatDurationHuman(metrics?.durationStats?.totalDuration ?? 0, t)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.totalDuration')}</Typography>
                </Box>
              </Box>
            </BentoCard>

            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-700-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-700)' }}>
                  <HardDrive size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {usageReport?.totalRecordings ?? recordingData?.totalRecordings ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.totalRecordings')}</Typography>
                </Box>
              </Box>
            </BentoCard>

            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(107, 114, 128, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <HardDrive size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {formatBytes(usageReport?.totalStorageBytes ?? recordingData?.totalStorageBytes ?? metrics?.storageUsedBytes ?? 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.storageUsed')}</Typography>
                </Box>
              </Box>
            </BentoCard>

            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-500-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)' }}>
                  <Activity size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                    {participantData?.maxConcurrentParticipants ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>{t('analytics.peakParticipants')}</Typography>
                </Box>
              </Box>
            </BentoCard>
          </Box>

          {/* Charts */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Participant Trend */}
            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BarChart3 size={20} color="var(--primary-600)" />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                  {t('analytics.participantTrend')}
                </Typography>
              </Box>
              <Box sx={{ height: 280 }}>
                {trendData.length > 0 && trendData.some((d) => d.participants > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorParticipantsAnalytics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary-600)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary-600)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--glass-bg)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(var(--primary-rgb), 0.15)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="participants"
                        stroke="var(--primary-600)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorParticipantsAnalytics)"
                        name={t('analytics.totalParticipants')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                      {t('analytics.noData')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </BentoCard>

            {/* Recordings by Type */}
            <BentoCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HardDrive size={20} color="var(--primary-500)" />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                  {t('analytics.recordingsByType')}
                </Typography>
              </Box>
              <Box sx={{ height: 280 }}>
                {recordingTypeData.length > 0 && recordingTypeData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recordingTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {recordingTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--glass-bg)',
                          border: '1px solid rgba(var(--primary-rgb), 0.15)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                      {t('analytics.noData')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </BentoCard>
          </Box>

          {/* Duration Stats */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Clock size={20} color="var(--primary-500)" />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                  {t('analytics.durationStats')}
                </Typography>
              </Box>
              <Box sx={{ height: 250 }}>
                {durationData.length > 0 && durationData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={durationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--glass-bg)',
                          border: '1px solid rgba(var(--primary-rgb), 0.15)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                        formatter={(value) => [formatDurationHuman(Number(value ?? 0), t), '']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {durationData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                      {t('analytics.noData')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

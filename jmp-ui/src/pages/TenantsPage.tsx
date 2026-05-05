import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  Globe,
  Video,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
  Play,
  Pause,
} from 'lucide-react';
import { tenantApi, type TenantSummary, type Tenant, type TenantCreateRequest, type TenantUpdateRequest, type TenantQuotas } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)', icon: <CheckCircle2 size={14} />, labelKey: 'common.active' };
    case 'SUSPENDED':
      return { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', icon: <AlertCircle size={14} />, labelKey: 'common.suspended' };
    case 'DELETED':
      return { color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)', icon: <XCircle size={14} />, labelKey: 'common.deleted' };
    default:
      return { color: '#6b7280', bgColor: 'rgba(107,114,128,0.08)', icon: null, labelKey: null };
  }
};

interface FormData {
  name: string;
  slug: string;
  description: string;
  domain: string;
  jitsiDomain: string;
  maxConcurrentConferences: string;
  maxParticipantsPerConference: string;
  maxRecordingStorageMb: string;
  maxConferenceDurationMinutes: string;
  allowedFeatures: string;
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  description: '',
  domain: '',
  jitsiDomain: '',
  maxConcurrentConferences: '10',
  maxParticipantsPerConference: '100',
  maxRecordingStorageMb: '10240',
  maxConferenceDurationMinutes: '240',
  allowedFeatures: 'chat,screen_share,recording,live_streaming',
};

// Shared field styling matching ConferencesPage
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text)',
    '& fieldset': { borderColor: 'var(--border)' },
    '&:hover fieldset': { borderColor: 'var(--border-strong)' },
    '&.Mui-focused fieldset': { borderColor: '#3b82b6' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82b6' },
};

export default function TenantsPage() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<TenantSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.getTenants({ search: search || undefined });
      setTenants(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [search]);

  const handleCreate = () => {
    setEditingTenant(null);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const handleEdit = async (tenant: TenantSummary) => {
    try {
      const response = await tenantApi.getTenant(tenant.id);
      const full = response.data;
      setEditingTenant(full);
      setFormData({
        name: full.name,
        slug: full.slug,
        description: full.description || '',
        domain: full.domain || '',
        jitsiDomain: full.jitsiDomain || '',
        maxConcurrentConferences: String(full.quotas?.maxConcurrentConferences ?? 10),
        maxParticipantsPerConference: String(full.quotas?.maxParticipantsPerConference ?? 100),
        maxRecordingStorageMb: String(full.quotas?.maxRecordingStorageMb ?? 10240),
        maxConferenceDurationMinutes: String(full.quotas?.maxConferenceDurationMinutes ?? 240),
        allowedFeatures: full.quotas?.allowedFeatures ?? 'chat,screen_share,recording,live_streaming',
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Failed to load tenant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('tenants.deleteConfirm'))) {
      try {
        await tenantApi.deleteTenant(id);
        fetchTenants();
      } catch (error) {
        console.error('Failed to delete tenant:', error);
      }
    }
  };

  const handleSuspendOpen = (tenant: TenantSummary) => {
    setSuspendTarget(tenant);
    setSuspendReason('');
    setOpenSuspendDialog(true);
  };

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    try {
      await tenantApi.suspendTenant(suspendTarget.id, suspendReason || undefined);
      setOpenSuspendDialog(false);
      fetchTenants();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await tenantApi.activateTenant(id);
      fetchTenants();
    } catch (error) {
      console.error('Failed to activate tenant:', error);
    }
  };

  const buildQuotas = (): TenantQuotas => ({
    maxConcurrentConferences: parseInt(formData.maxConcurrentConferences) || 10,
    maxParticipantsPerConference: parseInt(formData.maxParticipantsPerConference) || 100,
    maxRecordingStorageMb: parseInt(formData.maxRecordingStorageMb) || 10240,
    maxConferenceDurationMinutes: parseInt(formData.maxConferenceDurationMinutes) || 240,
    allowedFeatures: formData.allowedFeatures,
  });

  const handleSubmit = async () => {
    try {
      if (editingTenant) {
        const data: TenantUpdateRequest = {
          name: formData.name || undefined,
          description: formData.description || undefined,
          domain: formData.domain || undefined,
          jitsiDomain: formData.jitsiDomain || undefined,
          quotas: buildQuotas(),
        };
        await tenantApi.updateTenant(editingTenant.id, data);
      } else {
        const data: TenantCreateRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          domain: formData.domain || undefined,
          jitsiDomain: formData.jitsiDomain || undefined,
          quotas: buildQuotas(),
        };
        await tenantApi.createTenant(data);
      }
      setOpenDialog(false);
      fetchTenants();
    } catch (error) {
      console.error('Failed to save tenant:', error);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Search & Filter Bar */}
      <motion.div variants={itemVariants}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleCreate}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #3b82b6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 20px rgba(59, 130, 182, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 6px 25px rgba(59, 130, 182, 0.4)',
              },
            }}
          >
            {t('tenants.addTenant')}
          </Button>
          <TextField
            placeholder={t('tenants.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="var(--text-muted)" />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-xl)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'var(--border)' },
                '&.Mui-focused fieldset': { borderColor: '#3b82b6' },
              },
            }}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) {
                setViewMode(newMode);
              }
            }}
            sx={{
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                '&:not(:first-of-type)': {
                  borderLeft: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                },
                '&:not(:last-of-type)': {
                  borderRadius: 'var(--radius-lg)',
                },
              },
            }}
          >
            <ToggleButton
              value="cards"
              sx={{
                p: 1,
                color: 'var(--text-muted)',
                '&.Mui-selected': {
                  background: 'rgba(59, 130, 182, 0.12)',
                  color: '#3b82b6',
                  borderColor: '#3b82b6',
                },
                '&:hover': { background: 'var(--glass-bg)' },
              }}
            >
              <Tooltip title={t('common.viewCards')}>
                <LayoutGrid size={18} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="list"
              sx={{
                p: 1,
                color: 'var(--text-muted)',
                '&.Mui-selected': {
                  background: 'rgba(59, 130, 182, 0.12)',
                  color: '#3b82b6',
                  borderColor: '#3b82b6',
                },
                '&:hover': { background: 'var(--glass-bg)' },
              }}
            >
              <Tooltip title={t('common.viewList')}>
                <List size={18} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </motion.div>

      {/* Tenant Cards Grid */}
      {viewMode === 'cards' && (
        <motion.div variants={containerVariants}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            <AnimatePresence>
              {tenants.map((tenant, index) => {
                const statusConfig = getStatusConfig(tenant.status);
                const initials = tenant.name.substring(0, 2).toUpperCase();
                return (
                  <motion.div
                    key={tenant.id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      sx={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-lg)',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 'var(--shadow-xl)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Status Indicator */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: statusConfig.color,
                        }}
                      />

                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 'var(--radius-lg)',
                              background: `linear-gradient(135deg, ${statusConfig.color}20 0%, ${statusConfig.color}10 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: statusConfig.color,
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}
                          >
                            {initials}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                              {tenant.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                              {tenant.slug}
                            </Typography>
                          </Box>
                        </Box>
                        {/* Status Badge */}
                        <Chip
                          size="small"
                          icon={statusConfig.icon || undefined}
                          label={statusConfig.labelKey ? t(statusConfig.labelKey) : ''}
                          sx={{
                            background: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </Box>

                      {/* Domain Info Row */}
                      {(tenant.domain || tenant.jitsiDomain) && (
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {tenant.domain && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Globe size={16} color="var(--text-muted)" />
                              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                                {tenant.domain}
                              </Typography>
                            </Box>
                          )}
                          {tenant.jitsiDomain && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Video size={16} color="var(--text-muted)" />
                              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                                {tenant.jitsiDomain}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                        {tenant.status === 'ACTIVE' && (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Pause size={16} />}
                            onClick={() => handleSuspendOpen(tenant)}
                            sx={{
                              py: 1,
                              borderRadius: 'var(--radius-lg)',
                              background: '#f59e0b',
                              color: 'white',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': { background: '#d97706' },
                            }}
                          >
                            {t('tenants.suspendTenant')}
                          </Button>
                        )}
                        {tenant.status === 'SUSPENDED' && (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Play size={16} />}
                            onClick={() => handleActivate(tenant.id)}
                            sx={{
                              py: 1,
                              borderRadius: 'var(--radius-lg)',
                              background: '#22c55e',
                              color: 'white',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': { background: '#16a34a' },
                            }}
                          >
                            {t('tenants.activateTenant')}
                          </Button>
                        )}
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            onClick={() => handleEdit(tenant)}
                            sx={{
                              p: 1,
                              borderRadius: 'var(--radius-lg)',
                              color: 'var(--text-muted)',
                              '&:hover': {
                                background: 'rgba(59, 130, 182, 0.1)',
                                color: '#3b82b6',
                              },
                            }}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            onClick={() => handleDelete(tenant.id)}
                            sx={{
                              p: 1,
                              borderRadius: 'var(--radius-lg)',
                              color: 'var(--text-muted)',
                              '&:hover': {
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                              },
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        </motion.div>
      )}

      {/* Tenant List View */}
      {viewMode === 'list' && (
        <motion.div variants={containerVariants}>
          <Box
            sx={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            {/* Table Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '40px 1fr 100px',
                  sm: '40px 1.5fr 1fr 100px 100px 120px',
                  md: '40px 1.5fr 1fr 1fr 100px 100px 140px',
                },
                gap: 2,
                p: 2,
                borderBottom: '1px solid var(--border)',
                background: 'rgba(59, 130, 182, 0.04)',
              }}
            >
              <Box />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('tenants.name')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('tenants.domain')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'block' } }}>
                {t('tenants.jitsiDomain')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('common.status')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('tenants.slug')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </Typography>
            </Box>

            {/* Table Rows */}
            <AnimatePresence>
              {tenants.map((tenant, index) => {
                const statusConfig = getStatusConfig(tenant.status);
                const initials = tenant.name.substring(0, 2).toUpperCase();
                return (
                  <motion.div
                    key={tenant.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '40px 1fr 100px',
                          sm: '40px 1.5fr 1fr 100px 100px 120px',
                          md: '40px 1.5fr 1fr 1fr 100px 100px 140px',
                        },
                        gap: 2,
                        p: 2,
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                        '&:hover': { background: 'rgba(59, 130, 182, 0.04)' },
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      {/* Initials Icon */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${statusConfig.color}20 0%, ${statusConfig.color}10 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: statusConfig.color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        >
                          {initials}
                        </Box>
                      </Box>

                      {/* Name */}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tenant.name}
                        </Typography>
                      </Box>

                      {/* Domain */}
                      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        {tenant.domain ? (
                          <>
                            <Globe size={13} color="var(--text-muted)" />
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tenant.domain}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</Typography>
                        )}
                      </Box>

                      {/* Jitsi Domain */}
                      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        {tenant.jitsiDomain ? (
                          <>
                            <Video size={13} color="var(--text-muted)" />
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tenant.jitsiDomain}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</Typography>
                        )}
                      </Box>

                      {/* Status Badge */}
                      <Chip
                        size="small"
                        icon={statusConfig.icon || undefined}
                        label={statusConfig.labelKey ? t(statusConfig.labelKey) : ''}
                        sx={{
                          background: statusConfig.bgColor,
                          color: statusConfig.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />

                      {/* Slug */}
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                        {tenant.slug}
                      </Typography>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {tenant.status === 'ACTIVE' && (
                          <Tooltip title={t('tenants.suspendTenant')}>
                            <IconButton
                              size="small"
                              onClick={() => handleSuspendOpen(tenant)}
                              sx={{
                                p: 0.75,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                '&:hover': { background: 'rgba(245, 158, 11, 0.2)' },
                              }}
                            >
                              <Pause size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {tenant.status === 'SUSPENDED' && (
                          <Tooltip title={t('tenants.activateTenant')}>
                            <IconButton
                              size="small"
                              onClick={() => handleActivate(tenant.id)}
                              sx={{
                                p: 0.75,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                '&:hover': { background: 'rgba(34, 197, 94, 0.2)' },
                              }}
                            >
                              <Play size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(tenant)}
                            sx={{ p: 0.5, color: 'var(--text-muted)', '&:hover': { color: '#3b82b6' } }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(tenant.id)}
                            sx={{ p: 0.5, color: 'var(--text-muted)', '&:hover': { color: '#ef4444' } }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && tenants.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.02) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={40} color="#3b82b6" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 1 }}>
              {t('tenants.noTenants')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 3 }}>
              {t('tenants.noTenantsDesc')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
              sx={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #3b82b6 0%, #2563eb 100%)',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              {t('tenants.addTenant')}
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
            {editingTenant ? t('tenants.editTenant') : t('tenants.addTenant')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('tenants.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label={t('tenants.slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            margin="normal"
            disabled={!!editingTenant}
            helperText={editingTenant ? undefined : t('tenants.slugHelp')}
            FormHelperTextProps={{ sx: { color: 'var(--text-muted)' } }}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label={t('tenants.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            sx={fieldSx}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={t('tenants.domain')}
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              sx={{ flex: 1, minWidth: 200, ...fieldSx }}
            />
            <TextField
              label={t('tenants.jitsiDomain')}
              value={formData.jitsiDomain}
              onChange={(e) => setFormData({ ...formData, jitsiDomain: e.target.value })}
              sx={{ flex: 1, minWidth: 200, ...fieldSx }}
            />
          </Box>

          {/* Quotas Section */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ borderColor: 'var(--glass-border)', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              {t('tenants.quotas')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label={t('tenants.maxConferences')}
                  type="number"
                  value={formData.maxConcurrentConferences}
                  onChange={(e) => setFormData({ ...formData, maxConcurrentConferences: e.target.value })}
                  sx={{ flex: 1, minWidth: 200, ...fieldSx }}
                />
                <TextField
                  label={t('tenants.maxParticipants')}
                  type="number"
                  value={formData.maxParticipantsPerConference}
                  onChange={(e) => setFormData({ ...formData, maxParticipantsPerConference: e.target.value })}
                  sx={{ flex: 1, minWidth: 200, ...fieldSx }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label={t('tenants.maxStorage')}
                  type="number"
                  value={formData.maxRecordingStorageMb}
                  onChange={(e) => setFormData({ ...formData, maxRecordingStorageMb: e.target.value })}
                  helperText="MB"
                  FormHelperTextProps={{ sx: { color: 'var(--text-muted)' } }}
                  sx={{ flex: 1, minWidth: 200, ...fieldSx }}
                />
                <TextField
                  label={t('tenants.maxDuration')}
                  type="number"
                  value={formData.maxConferenceDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, maxConferenceDurationMinutes: e.target.value })}
                  helperText={t('tenants.minutes')}
                  FormHelperTextProps={{ sx: { color: 'var(--text-muted)' } }}
                  sx={{ flex: 1, minWidth: 200, ...fieldSx }}
                />
              </Box>
              <TextField
                label={t('tenants.allowedFeatures')}
                value={formData.allowedFeatures}
                onChange={(e) => setFormData({ ...formData, allowedFeatures: e.target.value })}
                fullWidth
                helperText={t('tenants.allowedFeaturesHelp')}
                FormHelperTextProps={{ sx: { color: 'var(--text-muted)' } }}
                sx={fieldSx}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #3b82b6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
            }}
          >
            {editingTenant ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog
        open={openSuspendDialog}
        onClose={() => setOpenSuspendDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
            {t('tenants.suspendTenant')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text)', mb: 2, fontSize: '0.9rem' }}>
            {t('tenants.suspendConfirm', { name: suspendTarget?.name })}
          </Typography>
          <TextField
            label={t('tenants.suspendReason')}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenSuspendDialog(false)}
            sx={{
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSuspendConfirm}
            sx={{
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
            }}
          >
            {t('tenants.suspendTenant')}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

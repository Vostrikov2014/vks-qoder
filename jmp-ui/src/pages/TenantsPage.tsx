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
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ChevronDown,
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

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(255,255,255,0.05)',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
    '& .MuiInputBase-input': { color: '#fff' },
  };

  const renderCard = (tenant: TenantSummary) => {
    const status = getStatusConfig(tenant.status);
    const initials = tenant.name.substring(0, 2).toUpperCase();
    return (
      <motion.div key={tenant.id} variants={itemVariants}>
        <Box
          sx={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-xl)',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            transition: 'all 0.2s',
            '&:hover': { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#3b82b6', width: 44, height: 44, fontSize: '0.9rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tenant.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                {tenant.slug}
              </Typography>
            </Box>
            <Chip
              icon={status.icon ?? undefined}
              label={status.labelKey ? t(status.labelKey) : tenant.status}
              size="small"
              sx={{ color: status.color, bgcolor: status.bgColor, borderRadius: '20px', fontSize: '0.75rem' }}
            />
          </Box>

          {(tenant.domain || tenant.jitsiDomain) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {tenant.domain && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Globe size={13} color="rgba(255,255,255,0.4)" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{tenant.domain}</Typography>
                </Box>
              )}
              {tenant.jitsiDomain && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Video size={13} color="rgba(255,255,255,0.4)" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{tenant.jitsiDomain}</Typography>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto', justifyContent: 'flex-end' }}>
            {tenant.status === 'ACTIVE' ? (
              <Tooltip title={t('tenants.suspendTenant')}>
                <IconButton size="small" onClick={() => handleSuspendOpen(tenant)} sx={{ color: '#f59e0b', '&:hover': { bgcolor: 'rgba(245,158,11,0.12)' } }}>
                  <Pause size={16} />
                </IconButton>
              </Tooltip>
            ) : tenant.status === 'SUSPENDED' ? (
              <Tooltip title={t('tenants.activateTenant')}>
                <IconButton size="small" onClick={() => handleActivate(tenant.id)} sx={{ color: '#22c55e', '&:hover': { bgcolor: 'rgba(34,197,94,0.12)' } }}>
                  <Play size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => handleEdit(tenant)} sx={{ color: '#60a5fa', '&:hover': { bgcolor: 'rgba(96,165,250,0.12)' } }}>
                <Edit2 size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" onClick={() => handleDelete(tenant.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' } }}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>
    );
  };

  const renderListRow = (tenant: TenantSummary) => {
    const status = getStatusConfig(tenant.status);
    return (
      <motion.div key={tenant.id} variants={itemVariants}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            mb: 1,
            '&:hover': { background: 'rgba(255,255,255,0.07)' },
          }}
        >
          <Avatar sx={{ bgcolor: '#3b82b6', width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700 }}>
            {tenant.name.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{tenant.name}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{tenant.slug}</Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', minWidth: 140 }}>{tenant.domain || '—'}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', minWidth: 160 }}>{tenant.jitsiDomain || '—'}</Typography>
          <Chip
            label={status.labelKey ? t(status.labelKey) : tenant.status}
            size="small"
            sx={{ color: status.color, bgcolor: status.bgColor, minWidth: 80, justifyContent: 'center' }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {tenant.status === 'ACTIVE' ? (
              <Tooltip title={t('tenants.suspendTenant')}>
                <IconButton size="small" onClick={() => handleSuspendOpen(tenant)} sx={{ color: '#f59e0b' }}>
                  <Pause size={15} />
                </IconButton>
              </Tooltip>
            ) : tenant.status === 'SUSPENDED' ? (
              <Tooltip title={t('tenants.activateTenant')}>
                <IconButton size="small" onClick={() => handleActivate(tenant.id)} sx={{ color: '#22c55e' }}>
                  <Play size={15} />
                </IconButton>
              </Tooltip>
            ) : null}
            <IconButton size="small" onClick={() => handleEdit(tenant)} sx={{ color: '#60a5fa' }}><Edit2 size={15} /></IconButton>
            <IconButton size="small" onClick={() => handleDelete(tenant.id)} sx={{ color: '#ef4444' }}><Trash2 size={15} /></IconButton>
          </Box>
        </Box>
      </motion.div>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Building2 size={24} color="#3b82b6" />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              {t('common.tenants')}
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {t('tenants.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
          sx={{ borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,#3b82b6,#60a5fa)', fontWeight: 600, px: 3 }}
        >
          {t('tenants.addTenant')}
        </Button>
      </Box>

      {/* Search + View toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('tenants.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 220, ...fieldSx }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="rgba(255,255,255,0.4)" /></InputAdornment> }}
        />
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small"
          sx={{ '& .MuiToggleButton-root': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)', '&.Mui-selected': { color: '#fff', bgcolor: 'rgba(59,130,182,0.2)' } } }}>
          <ToggleButton value="cards"><LayoutGrid size={16} /></ToggleButton>
          <ToggleButton value="list"><List size={16} /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.4)' }}>
          <Typography>{t('common.search')}...</Typography>
        </Box>
      ) : tenants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Building2 size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>{t('tenants.noTenants')}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{t('tenants.noTenantsDesc')}</Typography>
        </Box>
      ) : viewMode === 'cards' ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <AnimatePresence>{tenants.map(renderCard)}</AnimatePresence>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence>{tenants.map(renderListRow)}</AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)' } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>
          {editingTenant ? t('tenants.editTenant') : t('tenants.addTenant')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label={t('tenants.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth sx={fieldSx} />
          <TextField
            label={t('tenants.slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            fullWidth
            disabled={!!editingTenant}
            sx={fieldSx}
            helperText={editingTenant ? undefined : t('tenants.slugHelp')}
            FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
          />
          <TextField label={t('tenants.description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} sx={fieldSx} />
          <TextField label={t('tenants.domain')} value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} fullWidth sx={fieldSx} />
          <TextField label={t('tenants.jitsiDomain')} value={formData.jitsiDomain} onChange={(e) => setFormData({ ...formData, jitsiDomain: e.target.value })} fullWidth sx={fieldSx} />

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg) !important' }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} color="rgba(255,255,255,0.6)" />}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.9rem' }}>{t('tenants.quotas')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label={t('tenants.maxConferences')} type="number" value={formData.maxConcurrentConferences} onChange={(e) => setFormData({ ...formData, maxConcurrentConferences: e.target.value })} fullWidth sx={fieldSx} />
              <TextField label={t('tenants.maxParticipants')} type="number" value={formData.maxParticipantsPerConference} onChange={(e) => setFormData({ ...formData, maxParticipantsPerConference: e.target.value })} fullWidth sx={fieldSx} />
              <TextField label={t('tenants.maxStorage')} type="number" value={formData.maxRecordingStorageMb} onChange={(e) => setFormData({ ...formData, maxRecordingStorageMb: e.target.value })} fullWidth sx={fieldSx} helperText="MB" FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }} />
              <TextField label={t('tenants.maxDuration')} type="number" value={formData.maxConferenceDurationMinutes} onChange={(e) => setFormData({ ...formData, maxConferenceDurationMinutes: e.target.value })} fullWidth sx={fieldSx} helperText={t('tenants.minutes')} FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }} />
              <TextField label={t('tenants.allowedFeatures')} value={formData.allowedFeatures} onChange={(e) => setFormData({ ...formData, allowedFeatures: e.target.value })} fullWidth sx={fieldSx} helperText={t('tenants.allowedFeaturesHelp')} FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }} />
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-lg)' }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}
            sx={{ borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,#3b82b6,#60a5fa)', fontWeight: 600 }}>
            {editingTenant ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={openSuspendDialog} onClose={() => setOpenSuspendDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)' } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>{t('tenants.suspendTenant')}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontSize: '0.9rem' }}>
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
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenSuspendDialog(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-lg)' }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSuspendConfirm}
            sx={{ borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#000', fontWeight: 600 }}>
            {t('tenants.suspendTenant')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

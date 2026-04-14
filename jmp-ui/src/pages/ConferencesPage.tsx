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
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Square,
  Search,
  Video,
  Users,
  Calendar,
  Filter,
  Clock,
  Mic,
  Monitor,
  Radio,
  DoorOpen,
  Infinity,
  AlertCircle,
  Share2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { conferenceApi, participantAssignmentApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ShareModal from '../components/ShareModal';
import ParticipantManagementPanel from '../components/ParticipantManagementPanel';
import type { Conference, ConferenceType, AccessPolicy, ParticipantAssignment } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return {
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.12)',
        icon: <Radio size={14} />,
        labelKey: 'common.live',
      };
    case 'SCHEDULED':
      return {
        color: '#3b82b6',
        bgColor: 'rgba(59, 130, 182, 0.12)',
        icon: <Calendar size={14} />,
        labelKey: 'common.scheduled',
      };
    case 'ENDED':
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.12)',
        icon: <Square size={14} />,
        labelKey: 'common.ended',
      };
    default:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.08)',
        icon: null,
        labelKey: null,
      };
  }
};

const getTypeConfig = (type: ConferenceType) => {
  switch (type) {
    case 'SCHEDULED':
      return {
        color: '#3b82b6',
        bgColor: 'rgba(59, 130, 182, 0.12)',
        icon: <Calendar size={12} />,
        labelKey: 'common.conference',
      };
    case 'PERMANENT':
      return {
        color: '#2563eb',
        bgColor: 'rgba(37, 99, 235, 0.12)',
        icon: <DoorOpen size={12} />,
        labelKey: 'common.room',
      };
    default:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.08)',
        icon: null,
        labelKey: null,
      };
  }
};

// Helper to format datetime for input
const formatDateTimeForInput = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

// Helper to format datetime for display (locale passed dynamically)
const formatDateTimeDisplay = (dateStr: string | undefined, locale: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ConferencesPage() {
  const { t, i18n } = useTranslation();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConference, setEditingConference] = useState<Conference | null>(null);
  const [shareConference, setShareConference] = useState<Conference | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomName: '',
    displayName: '',
    description: '',
    type: 'SCHEDULED' as ConferenceType,
    scheduledStartAt: '',
    scheduledEndAt: '',
    enableRecording: false,
    enableLiveStreaming: false,
    enableChat: true,
    enableScreenSharing: true,
    enableLobby: false,
    accessPolicy: 'PUBLIC' as AccessPolicy,
    allowedDomain: '',
    waitingRoomEnabled: false,
    requireAuthForAssigned: true,
  });
  const [participants, setParticipants] = useState<ParticipantAssignment[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const fetchConferences = async () => {
    try {
      const response = await conferenceApi.getConferences({ search });
      setConferences(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch conferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, [search]);

  const handleCreate = () => {
    setEditingConference(null);
    setFormError(null);
    setParticipants([]);
    setFormData({
      roomName: '',
      displayName: '',
      description: '',
      type: 'SCHEDULED',
      scheduledStartAt: '',
      scheduledEndAt: '',
      enableRecording: false,
      enableLiveStreaming: false,
      enableChat: true,
      enableScreenSharing: true,
      enableLobby: false,
      accessPolicy: 'PUBLIC',
      allowedDomain: '',
      waitingRoomEnabled: false,
      requireAuthForAssigned: true,
    });
    setOpenDialog(true);
  };

  const handleEdit = (conference: Conference) => {
    setEditingConference(conference);
    setFormError(null);
    setParticipants([]);
    setFormData({
      roomName: conference.roomName,
      displayName: conference.displayName,
      description: conference.description || '',
      type: conference.type || 'SCHEDULED',
      scheduledStartAt: formatDateTimeForInput(conference.scheduledStartAt),
      scheduledEndAt: formatDateTimeForInput(conference.scheduledEndAt),
      enableRecording: conference.enableRecording,
      enableLiveStreaming: conference.enableLiveStreaming,
      enableChat: conference.enableChat ?? true,
      enableScreenSharing: conference.enableScreenSharing ?? true,
      enableLobby: conference.enableLobby ?? false,
      accessPolicy: conference.accessPolicy ?? 'PUBLIC',
      allowedDomain: conference.allowedDomain ?? '',
      waitingRoomEnabled: conference.waitingRoomEnabled ?? false,
      requireAuthForAssigned: conference.requireAuthForAssigned ?? true,
    });
    // Fetch existing participant assignments
    if (conference.id) {
      participantAssignmentApi.getAssignments(conference.id)
        .then((res) => setParticipants(res.data))
        .catch((err) => console.error('Failed to fetch participants:', err));
    }
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('conferences.deleteConfirm'))) {
      try {
        await conferenceApi.deleteConference(id);
        fetchConferences();
      } catch (error) {
        console.error('Failed to delete conference:', error);
      }
    }
  };

  // Helper to convert local datetime string to ISO-8601 instant format
  const toInstantString = (dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;
    // Convert "2026-04-08T10:00" to "2026-04-08T10:00:00Z" (UTC)
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  };

  const handleSubmit = async () => {
    try {
      setFormError(null);
      
      // Validate required fields
      if (!formData.roomName.trim() || !formData.displayName.trim()) {
        setFormError(t('conferences.requiredFields'));
        return;
      }

      // Validate SCHEDULED conference requirements
      if (formData.type === 'SCHEDULED' && !formData.scheduledStartAt) {
        setFormError(t('conferences.scheduledRequired'));
        return;
      }

      // Build the payload based on conference type
      const payload = {
        ...formData,
        // For PERMANENT conferences, clear scheduled times and set isAlwaysOn implicitly
        ...(formData.type === 'PERMANENT' && {
          scheduledStartAt: undefined,
          scheduledEndAt: undefined,
        }),
        // For SCHEDULED conferences, convert datetime-local to ISO instant format
        ...(formData.type === 'SCHEDULED' && {
          scheduledStartAt: toInstantString(formData.scheduledStartAt),
          scheduledEndAt: toInstantString(formData.scheduledEndAt),
        }),
        // Clear allowedDomain if not domain restricted
        ...(formData.accessPolicy !== 'DOMAIN_RESTRICTED' && {
          allowedDomain: undefined,
        }),
      };

      if (editingConference) {
        await conferenceApi.updateConference(editingConference.id, payload);
      } else {
        const created = await conferenceApi.createConference(payload);
        // Bulk assign local participants for new conference
        if (participants.length > 0 && created.data?.id) {
          try {
            await participantAssignmentApi.bulkAssign(created.data.id, {
              participants: participants.map((p) => ({ email: p.email, role: p.role })),
            });
          } catch (err) {
            console.error('Failed to bulk assign participants after create:', err);
          }
        }
      }
      setOpenDialog(false);
      fetchConferences();
    } catch (error: any) {
      console.error('Failed to save conference:', error);
      const errorMessage = error.response?.data?.detail || error.message || t('conferences.saveFailed');
      setFormError(errorMessage);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await conferenceApi.startConference(id);
      fetchConferences();

      // Generate Jitsi token and open Jitsi Web
      const user = useAuthStore.getState().user;
      const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Guest';
      const tokenResponse = await conferenceApi.generateToken(id, {
        conferenceId: id,
        displayName,
        isModerator: true,
      });
      const { roomUrl } = tokenResponse.data;
      if (roomUrl) {
        window.open(roomUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to start conference:', error);
    }
  };

  const handleEnd = async (id: string) => {
    try {
      await conferenceApi.endConference(id);
      fetchConferences();
    } catch (error) {
      console.error('Failed to end conference:', error);
    }
  };

  const handleShare = (conference: Conference) => {
    setShareConference(conference);
    setShareModalOpen(true);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)', mb: 0.5 }}>
              {t('common.conferences')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
              {t('conferences.subtitle')}
            </Typography>
          </Box>
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
            {t('conferences.createConference')}
          </Button>
        </Box>
      </motion.div>

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
          <TextField
            placeholder={t('conferences.searchPlaceholder')}
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
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--border)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82b6',
                },
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<Filter size={18} />}
            sx={{
              borderRadius: 'var(--radius-xl)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              textTransform: 'none',
              px: 3,
            }}
          >
            {t('common.filter')}
          </Button>
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
                '&:hover': {
                  background: 'var(--glass-bg)',
                },
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
                '&:hover': {
                  background: 'var(--glass-bg)',
                },
              }}
            >
              <Tooltip title={t('common.viewList')}>
                <List size={18} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </motion.div>

      {/* Conference Cards Grid */}
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
            {conferences.map((conference, index) => {
              const statusConfig = getStatusConfig(conference.status);
              const typeConfig = getTypeConfig(conference.type);
              return (
                <motion.div
                  key={conference.id}
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
                          }}
                        >
                          <Video size={22} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                            {conference.displayName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                            {conference.roomName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Type Badge */}
                        <Chip
                          size="small"
                          icon={typeConfig.icon || undefined}
                          label={typeConfig.labelKey ? t(typeConfig.labelKey) : ''}
                          sx={{
                            background: typeConfig.bgColor,
                            color: typeConfig.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: 'inherit',
                            },
                          }}
                        />
                        {/* Status Badge */}
                        <Chip
                          size="small"
                          icon={statusConfig.icon || undefined}
                          label={statusConfig.labelKey ? t(statusConfig.labelKey) : ''}
                          sx={{
                            background: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                              color: 'inherit',
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Description */}
                    {conference.description && (
                      <Typography variant="body2" sx={{ color: 'var(--text)', lineHeight: 1.5 }}>
                        {conference.description}
                      </Typography>
                    )}

                    {/* Info Row */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users size={16} color="var(--text-muted)" />
                        <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                          {conference.currentParticipants || 0} / {conference.maxParticipants || '∞'}
                        </Typography>
                      </Box>
                      {conference.type === 'SCHEDULED' && conference.scheduledStartAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Clock size={16} color="var(--text-muted)" />
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                            {formatDateTimeDisplay(conference.scheduledStartAt, i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                          </Typography>
                        </Box>
                      )}
                      {conference.type === 'PERMANENT' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Infinity size={16} color="#3b82b6" />
                          <Typography variant="body2" sx={{ color: '#3b82b6', fontWeight: 500 }}>
                            {t('conferences.alwaysAvailable')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Features */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {conference.enableRecording && (
                        <Tooltip title={t('conferences.recordingEnabled')}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                            }}
                          >
                            <Mic size={14} />
                          </Box>
                        </Tooltip>
                      )}
                      {conference.enableLiveStreaming && (
                        <Tooltip title={t('conferences.liveStreaming')}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(34, 197, 94, 0.1)',
                              color: '#22c55e',
                            }}
                          >
                            <Radio size={14} />
                          </Box>
                        </Tooltip>
                      )}
                      <Tooltip title={t('conferences.screenSharing')}>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(59, 130, 182, 0.1)',
                            color: '#3b82b6',
                          }}
                        >
                          <Monitor size={14} />
                        </Box>
                      </Tooltip>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                      {conference.status === 'SCHEDULED' && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Play size={16} />}
                          onClick={() => handleStart(conference.id)}
                          sx={{
                            py: 1,
                            borderRadius: 'var(--radius-lg)',
                            background: '#3b82b6',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              background: '#2563eb',
                            },
                          }}
                        >
                          {t('common.start')}
                        </Button>
                      )}
                      {conference.status === 'ACTIVE' && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Square size={16} />}
                          onClick={() => handleEnd(conference.id)}
                          sx={{
                            py: 1,
                            borderRadius: 'var(--radius-lg)',
                            background: '#6b7280',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              background: '#4b5563',
                            },
                          }}
                        >
                          {t('common.end')}
                        </Button>
                      )}
                      <Tooltip title={t('common.share')}>
                        <IconButton
                          onClick={() => handleShare(conference)}
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
                          <Share2 size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          onClick={() => handleEdit(conference)}
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
                          onClick={() => handleDelete(conference.id)}
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

      {/* Conference List View */}
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
                  xs: '40px 1fr 100px 100px',
                  sm: '40px 1.5fr 1fr 100px 100px 80px 120px',
                  md: '40px 1.5fr 1fr 100px 100px 80px 100px 140px',
                },
                gap: 2,
                p: 2,
                borderBottom: '1px solid var(--border)',
                background: 'rgba(59, 130, 182, 0.04)',
              }}
            >
              <Box />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('conferences.displayName')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('conferences.roomName')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('conferences.type')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('common.scheduled')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('conferences.participants')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'block' } }}>
                Features
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </Typography>
            </Box>

            {/* Table Rows */}
            <AnimatePresence>
              {conferences.map((conference, index) => {
                const statusConfig = getStatusConfig(conference.status);
                const typeConfig = getTypeConfig(conference.type);
                return (
                  <motion.div
                    key={conference.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '40px 1fr 100px 100px',
                          sm: '40px 1.5fr 1fr 100px 100px 80px 120px',
                          md: '40px 1.5fr 1fr 100px 100px 80px 100px 140px',
                        },
                        gap: 2,
                        p: 2,
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                        '&:hover': {
                          background: 'rgba(59, 130, 182, 0.04)',
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      {/* Status Dot */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: statusConfig.color,
                            boxShadow: `0 0 8px ${statusConfig.color}`,
                          }}
                        />
                      </Box>

                      {/* Display Name */}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conference.displayName}
                        </Typography>
                      </Box>

                      {/* Room Name */}
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                        {conference.roomName}
                      </Typography>

                      {/* Type Badge */}
                      <Chip
                        size="small"
                        icon={typeConfig.icon || undefined}
                        label={typeConfig.labelKey ? t(typeConfig.labelKey) : ''}
                        sx={{
                          background: typeConfig.bgColor,
                          color: typeConfig.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          '& .MuiChip-icon': {
                            color: 'inherit',
                          },
                        }}
                      />

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
                          '& .MuiChip-icon': {
                            color: 'inherit',
                          },
                        }}
                      />

                      {/* Participants */}
                      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                        <Users size={14} color="var(--text-muted)" />
                        <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                          {conference.currentParticipants || 0}/{conference.maxParticipants || '∞'}
                        </Typography>
                      </Box>

                      {/* Features */}
                      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                        {conference.enableRecording && (
                          <Tooltip title={t('conferences.recordingEnabled')}>
                            <Box sx={{ p: 0.5, borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                              <Mic size={12} />
                            </Box>
                          </Tooltip>
                        )}
                        {conference.enableLiveStreaming && (
                          <Tooltip title={t('conferences.liveStreaming')}>
                            <Box sx={{ p: 0.5, borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center' }}>
                              <Radio size={12} />
                            </Box>
                          </Tooltip>
                        )}
                        {conference.enableScreenSharing && (
                          <Tooltip title={t('conferences.screenSharing')}>
                            <Box sx={{ p: 0.5, borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 182, 0.1)', color: '#3b82b6', display: 'flex', alignItems: 'center' }}>
                              <Monitor size={12} />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {conference.status === 'SCHEDULED' && (
                          <Tooltip title={t('common.start')}>
                            <IconButton
                              size="small"
                              onClick={() => handleStart(conference.id)}
                              sx={{
                                p: 0.75,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(59, 130, 182, 0.1)',
                                color: '#3b82b6',
                                '&:hover': { background: 'rgba(59, 130, 182, 0.2)' },
                              }}
                            >
                              <Play size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {conference.status === 'ACTIVE' && (
                          <Tooltip title={t('common.end')}>
                            <IconButton
                              size="small"
                              onClick={() => handleEnd(conference.id)}
                              sx={{
                                p: 0.75,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(107, 114, 128, 0.1)',
                                color: '#6b7280',
                                '&:hover': { background: 'rgba(107, 114, 128, 0.2)' },
                              }}
                            >
                              <Square size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('common.share')}>
                          <IconButton
                            size="small"
                            onClick={() => handleShare(conference)}
                            sx={{ p: 0.5, color: 'var(--text-muted)', '&:hover': { color: '#3b82b6' } }}
                          >
                            <Share2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(conference)}
                            sx={{ p: 0.5, color: 'var(--text-muted)', '&:hover': { color: '#3b82b6' } }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(conference.id)}
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
      {!loading && conferences.length === 0 && (
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
              <Video size={40} color="#3b82b6" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 1 }}>
              {t('conferences.noConferences')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 3 }}>
              {t('conferences.noConferencesDesc')}
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
              {t('conferences.createConference')}
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setFormError(null);
        }}
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
            {editingConference ? t('conferences.editConference') : t('conferences.createConference')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Error Alert */}
          {formError && (
            <Alert
              severity="error"
              icon={<AlertCircle size={20} />}
              onClose={() => setFormError(null)}
              sx={{
                mt: 2,
                mb: 2,
                background: 'rgba(239, 68, 68, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-lg)',
                color: '#dc2626',
                '& .MuiAlert-icon': {
                  color: '#ef4444',
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                },
                '& .MuiIconButton-root': {
                  color: '#dc2626',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.1)',
                  },
                },
              }}
            >
              {formError}
            </Alert>
          )}
          {/* Type Selector */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 1, fontWeight: 500 }}>
              {t('conferences.type')}
            </Typography>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setFormData({ ...formData, type: newType });
                }
              }}
              sx={{
                width: '100%',
                gap: 1,
                '& .MuiToggleButton-root': {
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  textTransform: 'none',
                  fontWeight: 500,
                  py: 1.5,
                  '&.Mui-selected': {
                    background: 'rgba(59, 130, 182, 0.12)',
                    color: '#3b82f6',
                    borderColor: '#3b82f6',
                  },
                  '&:hover': {
                    background: 'var(--glass-bg)',
                  },
                },
              }}
            >
              <ToggleButton value="SCHEDULED">
                <Calendar size={18} style={{ marginRight: 8 }} />
                {t('common.conference')}
              </ToggleButton>
              <ToggleButton value="PERMANENT">
                <DoorOpen size={18} style={{ marginRight: 8 }} />
                {t('common.room')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            label={t('conferences.roomName')}
            value={formData.roomName}
            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
            margin="normal"
            disabled={!!editingConference}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text)',
                '& fieldset': {
                  borderColor: 'var(--border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--border-strong)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82b6',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-muted)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#3b82b6',
              },
            }}
          />
          <TextField
            fullWidth
            label={t('conferences.displayName')}
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text)',
                '& fieldset': {
                  borderColor: 'var(--border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--border-strong)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82b6',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-muted)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#3b82b6',
              },
            }}
          />
          <TextField
            fullWidth
            label={t('conferences.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text)',
                '& fieldset': {
                  borderColor: 'var(--border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--border-strong)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82b6',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-muted)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#3b82b6',
              },
            }}
          />

          {/* Scheduled Date/Time Fields */}
          {formData.type === 'SCHEDULED' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label={t('conferences.startTime')}
                type="datetime-local"
                value={formData.scheduledStartAt}
                onChange={(e) => setFormData({ ...formData, scheduledStartAt: e.target.value })}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text)',
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-strong)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82b6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-muted)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82b6',
                  },
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('conferences.endTime')}
                type="datetime-local"
                value={formData.scheduledEndAt}
                onChange={(e) => setFormData({ ...formData, scheduledEndAt: e.target.value })}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text)',
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-strong)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82b6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-muted)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3b82b6',
                  },
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableRecording}
                  onChange={(e) => setFormData({ ...formData, enableRecording: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: 'var(--text-muted)',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: 'var(--border-strong)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3b82b6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(59, 130, 182, 0.4)',
                    },
                  }}
                />
              }
              label={t('conferences.enableRecording')}
              sx={{ color: 'var(--text)' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableLiveStreaming}
                  onChange={(e) => setFormData({ ...formData, enableLiveStreaming: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: 'var(--text-muted)',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: 'var(--border-strong)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3b82b6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(59, 130, 182, 0.4)',
                    },
                  }}
                />
              }
              label={t('conferences.enableLiveStreaming')}
              sx={{ color: 'var(--text)' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableLobby}
                  onChange={(e) => setFormData({ ...formData, enableLobby: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: 'var(--text-muted)',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: 'var(--border-strong)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3b82b6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(59, 130, 182, 0.4)',
                    },
                  }}
                />
              }
              label={t('conferences.enableLobby')}
              sx={{ color: 'var(--text)' }}
            />
          </Box>

          {/* Access Control Section */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ borderColor: 'var(--glass-border)', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              {t('conferences.accessControl')}
            </Typography>

            {/* Access Policy Selector */}
            <FormControl
              fullWidth
              size="small"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text)',
                  '& fieldset': { borderColor: 'var(--border)' },
                  '&:hover fieldset': { borderColor: 'var(--border-strong)' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82b6' },
                },
                '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#3b82b6' },
                '& .MuiSelect-icon': { color: 'var(--text-muted)' },
              }}
            >
              <InputLabel>{t('conferences.accessPolicy')}</InputLabel>
              <Select
                value={formData.accessPolicy}
                label={t('conferences.accessPolicy')}
                onChange={(e) => setFormData({ ...formData, accessPolicy: e.target.value as AccessPolicy })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      '& .MuiMenuItem-root': {
                        color: 'var(--text)',
                        '&:hover': { background: 'rgba(59, 130, 182, 0.08)' },
                        '&.Mui-selected': { background: 'rgba(59, 130, 182, 0.12)', color: '#3b82b6' },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="PUBLIC">{t('conferences.accessPolicyPublic')}</MenuItem>
                <MenuItem value="ASSIGNED_ONLY">{t('conferences.accessPolicyAssignedOnly')}</MenuItem>
                <MenuItem value="DOMAIN_RESTRICTED">{t('conferences.accessPolicyDomainRestricted')}</MenuItem>
              </Select>
            </FormControl>

            {/* Allowed Domain Input */}
            {formData.accessPolicy === 'DOMAIN_RESTRICTED' && (
              <TextField
                fullWidth
                size="small"
                label={t('conferences.allowedDomain')}
                placeholder="company.com"
                value={formData.allowedDomain}
                onChange={(e) => setFormData({ ...formData, allowedDomain: e.target.value })}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text)',
                    '& fieldset': { borderColor: 'var(--border)' },
                    '&:hover fieldset': { borderColor: 'var(--border-strong)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82b6' },
                  },
                  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82b6' },
                }}
              />
            )}

            {/* Waiting Room Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.waitingRoomEnabled}
                  onChange={(e) => setFormData({ ...formData, waitingRoomEnabled: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase': { color: 'var(--text-muted)' },
                    '& .MuiSwitch-track': { backgroundColor: 'var(--border-strong)' },
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82b6' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(59, 130, 182, 0.4)' },
                  }}
                />
              }
              label={t('conferences.waitingRoom')}
              sx={{ color: 'var(--text)', display: 'flex' }}
            />

            {/* Require Auth Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requireAuthForAssigned}
                  onChange={(e) => setFormData({ ...formData, requireAuthForAssigned: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase': { color: 'var(--text-muted)' },
                    '& .MuiSwitch-track': { backgroundColor: 'var(--border-strong)' },
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82b6' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(59, 130, 182, 0.4)' },
                  }}
                />
              }
              label={t('conferences.requireAuth')}
              sx={{ color: 'var(--text)', display: 'flex' }}
            />

            {/* Participant Management Panel */}
            {(formData.accessPolicy === 'ASSIGNED_ONLY' || formData.accessPolicy === 'DOMAIN_RESTRICTED') && (
              <ParticipantManagementPanel
                conferenceId={editingConference?.id}
                participants={participants}
                onParticipantsChange={setParticipants}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setFormError(null);
            }}
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
            {editingConference ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Modal */}
      <ShareModal
        conference={shareConference}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </motion.div>
  );
}

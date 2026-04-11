import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { conferenceApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ShareModal from '../components/ShareModal';
import type { Conference, ConferenceType } from '../types';

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
        label: 'Live',
      };
    case 'SCHEDULED':
      return {
        color: '#3b82b6',
        bgColor: 'rgba(59, 130, 182, 0.12)',
        icon: <Calendar size={14} />,
        label: 'Scheduled',
      };
    case 'ENDED':
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.12)',
        icon: <Square size={14} />,
        label: 'Ended',
      };
    default:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.08)',
        icon: null,
        label: status,
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
        label: 'Conference',
      };
    case 'PERMANENT':
      return {
        color: '#2563eb',
        bgColor: 'rgba(37, 99, 235, 0.12)',
        icon: <DoorOpen size={12} />,
        label: 'Room',
      };
    default:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.08)',
        icon: null,
        label: type,
      };
  }
};

// Helper to format datetime for input
const formatDateTimeForInput = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

// Helper to format datetime for display
const formatDateTimeDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ConferencesPage() {
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
  });
  const [formError, setFormError] = useState<string | null>(null);

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
    });
    setOpenDialog(true);
  };

  const handleEdit = (conference: Conference) => {
    setEditingConference(conference);
    setFormError(null);
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
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this conference?')) {
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
        setFormError('Room Name and Display Name are required.');
        return;
      }

      // Validate SCHEDULED conference requirements
      if (formData.type === 'SCHEDULED' && !formData.scheduledStartAt) {
        setFormError('Scheduled conferences must have a start time.');
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
      };

      if (editingConference) {
        await conferenceApi.updateConference(editingConference.id, payload);
      } else {
        await conferenceApi.createConference(payload);
      }
      setOpenDialog(false);
      fetchConferences();
    } catch (error: any) {
      console.error('Failed to save conference:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save conference. Please try again.';
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
              Conferences
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
              Manage your video conferences and meetings
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
            Create Conference
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
            placeholder="Search conferences..."
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
            Filter
          </Button>
        </Box>
      </motion.div>

      {/* Conference Cards Grid */}
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
                          label={typeConfig.label}
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
                          label={statusConfig.label}
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
                            {formatDateTimeDisplay(conference.scheduledStartAt)}
                          </Typography>
                        </Box>
                      )}
                      {conference.type === 'PERMANENT' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Infinity size={16} color="#3b82b6" />
                          <Typography variant="body2" sx={{ color: '#3b82b6', fontWeight: 500 }}>
                            Always Available
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Features */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {conference.enableRecording && (
                        <Tooltip title="Recording enabled">
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
                        <Tooltip title="Live streaming">
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
                      <Tooltip title="Screen sharing">
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
                          Start
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
                          End
                        </Button>
                      )}
                      <Tooltip title="Share">
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
                      <Tooltip title="Edit">
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
                      <Tooltip title="Delete">
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
              No conferences yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 3 }}>
              Create your first conference to get started
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
              Create Conference
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
        maxWidth="sm"
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
            {editingConference ? 'Edit Conference' : 'Create Conference'}
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
              Type
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
                    color: '#3b82b6',
                    borderColor: '#3b82b6',
                  },
                  '&:hover': {
                    background: 'var(--glass-bg)',
                  },
                },
              }}
            >
              <ToggleButton value="SCHEDULED">
                <Calendar size={18} style={{ marginRight: 8 }} />
                Conference
              </ToggleButton>
              <ToggleButton value="PERMANENT">
                <DoorOpen size={18} style={{ marginRight: 8 }} />
                Room
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            label="Room Name"
            value={formData.roomName}
            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
            margin="normal"
            disabled={!!editingConference}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
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
            }}
          />
          <TextField
            fullWidth
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
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
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
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
            }}
          />

          {/* Scheduled Date/Time Fields */}
          {formData.type === 'SCHEDULED' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Start Time"
                type="datetime-local"
                value={formData.scheduledStartAt}
                onChange={(e) => setFormData({ ...formData, scheduledStartAt: e.target.value })}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
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
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="datetime-local"
                value={formData.scheduledEndAt}
                onChange={(e) => setFormData({ ...formData, scheduledEndAt: e.target.value })}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-lg)',
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
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3b82b6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#3b82b6',
                    },
                  }}
                />
              }
              label="Enable Recording"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableLiveStreaming}
                  onChange={(e) => setFormData({ ...formData, enableLiveStreaming: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#22c55e',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#22c55e',
                    },
                  }}
                />
              }
              label="Enable Live Streaming"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableLobby}
                  onChange={(e) => setFormData({ ...formData, enableLobby: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#f97316',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#f97316',
                    },
                  }}
                />
              }
              label="Enable Lobby"
            />
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
            Cancel
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
            {editingConference ? 'Update' : 'Create'}
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

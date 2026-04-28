import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Button,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import PersonIcon from '@mui/icons-material/Person';
import { participantAssignmentApi } from '../services/api';
import type { ParticipantAssignment, AssignmentRole } from '../types';

interface ParticipantManagementPanelProps {
  conferenceId?: string;
  participants: ParticipantAssignment[];
  onParticipantsChange: (participants: ParticipantAssignment[]) => void;
}

const statusChipConfig: Record<string, { color: 'info' | 'success' | 'warning' | 'primary' | 'error' | 'default' }> = {
  INVITED: { color: 'info' },
  ACCEPTED: { color: 'success' },
  DECLINED: { color: 'warning' },
  JOINED: { color: 'primary' },
  REMOVED: { color: 'error' },
};

const switchSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text)',
    background: 'transparent',
    '& fieldset': { borderColor: 'var(--border)' },
    '&:hover fieldset': { borderColor: 'var(--border-strong)' },
    '&.Mui-focused fieldset': { borderColor: '#3b82b6' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82b6' },
  '& .MuiSelect-icon': { color: 'var(--text-muted)' },
};

export default function ParticipantManagementPanel({
  conferenceId,
  participants,
  onParticipantsChange,
}: ParticipantManagementPanelProps) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AssignmentRole>('PARTICIPANT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    const email = newEmail.trim();
    if (!email) return;

    if (conferenceId) {
      try {
        const res = await participantAssignmentApi.assignParticipant(conferenceId, {
          email,
          role: newRole,
        });
        onParticipantsChange([...participants, res.data]);
      } catch (err) {
        console.error('Failed to assign participant:', err);
      }
    } else {
      // Local state for new (unsaved) conference
      const tempEntry: ParticipantAssignment = {
        id: `temp-${Date.now()}`,
        conferenceId: '',
        email,
        role: newRole,
        status: 'INVITED',
        requireAuth: false,
      };
      onParticipantsChange([...participants, tempEntry]);
    }

    setNewEmail('');
    setNewRole('PARTICIPANT');
  };

  const handleRoleChange = async (assignmentId: string, role: AssignmentRole) => {
    if (conferenceId) {
      try {
        await participantAssignmentApi.updateAssignment(conferenceId, assignmentId, { role });
      } catch (err) {
        console.error('Failed to update assignment:', err);
      }
    }
    onParticipantsChange(
      participants.map((p) => (p.id === assignmentId ? { ...p, role } : p))
    );
  };

  const handleRemove = async (assignmentId: string) => {
    if (conferenceId && !assignmentId.startsWith('temp-')) {
      try {
        await participantAssignmentApi.removeAssignment(conferenceId, assignmentId);
      } catch (err) {
        console.error('Failed to remove assignment:', err);
      }
    }
    onParticipantsChange(participants.filter((p) => p.id !== assignmentId));
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());

    const parsed: Array<{ email: string; role: AssignmentRole }> = [];
    for (const line of lines) {
      const parts = line.split(',').map((s) => s.trim());
      const email = parts[0];
      const roleRaw = (parts[1] || '').toUpperCase() as AssignmentRole;
      const role: AssignmentRole = ['PARTICIPANT', 'MODERATOR', 'PRESENTER'].includes(roleRaw)
        ? roleRaw
        : 'PARTICIPANT';
      if (email && email.includes('@')) {
        parsed.push({ email, role });
      }
    }

    if (parsed.length === 0) return;

    if (conferenceId) {
      try {
        const res = await participantAssignmentApi.bulkAssign(conferenceId, {
          participants: parsed.map((p) => ({ email: p.email, role: p.role })),
        });
        onParticipantsChange([...participants, ...res.data]);
      } catch (err) {
        console.error('Failed to bulk assign:', err);
      }
    } else {
      const newEntries: ParticipantAssignment[] = parsed.map((p) => ({
        id: `temp-${Date.now()}-${p.email}`,
        conferenceId: '',
        email: p.email,
        role: p.role,
        status: 'INVITED',
        requireAuth: false,
      }));
      onParticipantsChange([...participants, ...newEntries]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'INVITED': return 'Invited';
      case 'ACCEPTED': return 'Accepted';
      case 'DECLINED': return 'Declined';
      case 'JOINED': return 'Joined';
      case 'REMOVED': return 'Removed';
      default: return status;
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        background: 'rgba(59, 130, 182, 0.04)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: '#3b82b6', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
            {t('conferences.participantManagement')}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
          {participants.length} {t('conferences.participantsAssigned')}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'var(--glass-border)', mb: 2 }} />

      {/* Add participant row */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('conferences.email')}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          sx={{
            flex: 2,
            minWidth: 160,
            ...switchSx,
          }}
        />
        <FormControl size="small" sx={{ flex: 1, minWidth: 120, ...switchSx }}>
          <InputLabel>{t('conferences.role')}</InputLabel>
          <Select
            value={newRole}
            label={t('conferences.role')}
            onChange={(e) => setNewRole(e.target.value as AssignmentRole)}
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
            <MenuItem value="PARTICIPANT">{t('conferences.participant')}</MenuItem>
            <MenuItem value="MODERATOR">{t('conferences.moderator')}</MenuItem>
            <MenuItem value="PRESENTER">{t('conferences.presenter')}</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title={t('conferences.addParticipant')}>
          <span>
            <IconButton
              onClick={handleAdd}
              disabled={!newEmail.trim()}
              sx={{
                p: 1,
                borderRadius: 'var(--radius-lg)',
                background: newEmail.trim() ? 'rgba(59, 130, 182, 0.12)' : 'transparent',
                color: newEmail.trim() ? '#3b82b6' : 'var(--text-muted)',
                border: '1px solid var(--glass-border)',
                '&:hover': { background: 'rgba(59, 130, 182, 0.2)' },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Participant list */}
      <Box
        sx={{
          maxHeight: 300,
          overflowY: 'auto',
          mb: participants.length > 0 ? 2 : 0,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--glass-border)',
            borderRadius: 3,
          },
        }}
      >
        <AnimatePresence>
          {participants.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  px: 1,
                  borderRadius: 'var(--radius-lg)',
                  '&:hover': { background: 'rgba(59, 130, 182, 0.04)' },
                  flexWrap: 'wrap',
                }}
              >
                {/* Email */}
                <Typography
                  variant="body2"
                  sx={{
                    flex: 2,
                    minWidth: 120,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  {p.email}
                </Typography>

                {/* Role selector */}
                <FormControl size="small" sx={{ flex: 1, minWidth: 110, ...switchSx }}>
                  <Select
                    value={p.role}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as AssignmentRole)}
                    variant="outlined"
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
                    <MenuItem value="PARTICIPANT">{t('conferences.participant')}</MenuItem>
                    <MenuItem value="MODERATOR">{t('conferences.moderator')}</MenuItem>
                    <MenuItem value="PRESENTER">{t('conferences.presenter')}</MenuItem>
                  </Select>
                </FormControl>

                {/* Status chip */}
                <Chip
                  size="small"
                  label={statusLabel(p.status)}
                  color={statusChipConfig[p.status]?.color || 'default'}
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />

                {/* Remove button */}
                <Tooltip title={t('common.delete')}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(p.id)}
                    sx={{
                      p: 0.5,
                      color: 'var(--text-muted)',
                      '&:hover': { color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* CSV Import */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleCsvImport}
        />
        <Button
          size="small"
          startIcon={<UploadIcon fontSize="small" />}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            textTransform: 'none',
            border: '1px solid var(--glass-border)',
            px: 2,
            fontSize: '0.8rem',
            '&:hover': {
              background: 'rgba(59, 130, 182, 0.08)',
              color: '#3b82b6',
              borderColor: '#3b82b6',
            },
          }}
        >
          {t('conferences.importCsv')}
        </Button>
      </Box>
    </Box>
  );
}

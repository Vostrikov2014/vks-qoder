import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { conferenceApi } from '../services/api';

interface Conference {
  id: string;
  roomName: string;
  displayName: string;
  description?: string;
  status: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  currentParticipants?: number;
  maxParticipants?: number;
  enableRecording: boolean;
  enableLiveStreaming: boolean;
}

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConference, setEditingConference] = useState<Conference | null>(null);
  const [formData, setFormData] = useState({
    roomName: '',
    displayName: '',
    description: '',
    enableRecording: false,
    enableLiveStreaming: false,
    enableChat: true,
    enableScreenSharing: true,
  });

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
    setFormData({
      roomName: '',
      displayName: '',
      description: '',
      enableRecording: false,
      enableLiveStreaming: false,
      enableChat: true,
      enableScreenSharing: true,
    });
    setOpenDialog(true);
  };

  const handleEdit = (conference: Conference) => {
    setEditingConference(conference);
    setFormData({
      roomName: conference.roomName,
      displayName: conference.displayName,
      description: conference.description || '',
      enableRecording: conference.enableRecording,
      enableLiveStreaming: conference.enableLiveStreaming,
      enableChat: true,
      enableScreenSharing: true,
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

  const handleSubmit = async () => {
    try {
      if (editingConference) {
        await conferenceApi.updateConference(editingConference.id, formData);
      } else {
        await conferenceApi.createConference(formData);
      }
      setOpenDialog(false);
      fetchConferences();
    } catch (error) {
      console.error('Failed to save conference:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await conferenceApi.startConference(id);
      fetchConferences();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SCHEDULED':
        return 'info';
      case 'ENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Conferences</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Conference
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search conferences"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Room Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell>Scheduled</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conferences.map((conference) => (
              <TableRow key={conference.id}>
                <TableCell>
                  <Typography variant="subtitle2">{conference.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {conference.roomName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={conference.status}
                    color={getStatusColor(conference.status) as 'success' | 'info' | 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {conference.currentParticipants || 0} / {conference.maxParticipants || '∞'}
                </TableCell>
                <TableCell>
                  {conference.scheduledStartAt
                    ? new Date(conference.scheduledStartAt).toLocaleString()
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>
                  {conference.status === 'SCHEDULED' && (
                    <IconButton onClick={() => handleStart(conference.id)} color="success">
                      <PlayIcon />
                    </IconButton>
                  )}
                  {conference.status === 'ACTIVE' && (
                    <IconButton onClick={() => handleEnd(conference.id)} color="error">
                      <StopIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleEdit(conference)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(conference.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConference ? 'Edit Conference' : 'Create Conference'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Room Name"
            value={formData.roomName}
            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
            margin="normal"
            disabled={!!editingConference}
          />
          <TextField
            fullWidth
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableRecording}
                onChange={(e) => setFormData({ ...formData, enableRecording: e.target.checked })}
              />
            }
            label="Enable Recording"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableLiveStreaming}
                onChange={(e) => setFormData({ ...formData, enableLiveStreaming: e.target.checked })}
              />
            }
            label="Enable Live Streaming"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingConference ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Play,
  Download,
  Trash2,
  HardDrive,
  X,
  Film,
  FileAudio,
  FileText,
} from 'lucide-react';
import { recordingApi } from '../services/api';
import type { RecordingSummary } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'READY':
      return { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' };
    case 'PROCESSING':
      return { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' };
    case 'PENDING':
      return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.12)' };
    case 'FAILED':
      return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)' };
    default:
      return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.12)' };
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'VIDEO':
      return <Film size={16} />;
    case 'AUDIO':
      return <FileAudio size={16} />;
    case 'TRANSCRIPT':
      return <FileText size={16} />;
    default:
      return <Film size={16} />;
  }
};

const formatBytes = (bytes: number | null): string => {
  if (bytes == null || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatDuration = (seconds: number | null): string => {
  if (seconds == null || seconds === 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

interface StorageStats {
  totalStorageBytes: number;
  totalRecordings: number;
  recordingsThisMonth: number;
}

export default function RecordingsPage() {
  const { t, i18n } = useTranslation();
  const [recordings, setRecordings] = useState<RecordingSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<RecordingSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Video player dialog
  const [playerOpen, setPlayerOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recordingApi.getRecordings({
        page,
        size: rowsPerPage,
        search: search || undefined,
      });
      let items = response.data.content || [];
      if (typeFilter) {
        items = items.filter((r) => r.recordingType === typeFilter);
      }
      if (statusFilter) {
        items = items.filter((r) => r.status === statusFilter);
      }
      setRecordings(items);
      setTotalCount(response.data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter, statusFilter]);

  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await recordingApi.getStorageStats();
      setStorageStats(response.data);
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    fetchStorageStats();
  }, [fetchStorageStats]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDeleteClick = (recording: RecordingSummary) => {
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordingToDelete) return;
    setDeleting(true);
    try {
      await recordingApi.deleteRecording(recordingToDelete.id);
      setDeleteDialogOpen(false);
      setRecordingToDelete(null);
      fetchRecordings();
      fetchStorageStats();
    } catch (error) {
      console.error('Failed to delete recording:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handlePlay = async (recording: RecordingSummary) => {
    try {
      const response = await recordingApi.getDownloadUrl(recording.id);
      const url = response.data.downloadUrl;
      if (recording.recordingType === 'VIDEO') {
        setVideoUrl(url);
        setPlayerOpen(true);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to get download URL:', error);
    }
  };

  const handleDownload = async (recording: RecordingSummary) => {
    try {
      const response = await recordingApi.getDownloadUrl(recording.id);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Storage Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <motion.div variants={itemVariants}>
          <Box
            sx={{
              p: 3,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(201, 154, 91, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C99A5B',
                }}
              >
                <HardDrive size={20} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                  {storageStats ? formatBytes(storageStats.totalStorageBytes) : '—'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {t('recordings.totalStorage')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Box
            sx={{
              p: 3,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(11, 113, 134, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B7186',
                }}
              >
                <Film size={20} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                  {storageStats?.totalRecordings ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {t('recordings.totalRecordings')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Box
            sx={{
              p: 3,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(25, 179, 198, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#19B3C6',
                }}
              >
                <FileText size={20} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
                  {storageStats?.recordingsThisMonth ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {t('recordings.thisMonth')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* Filters & Search */}
      <motion.div variants={itemVariants}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder={t('recordings.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="var(--text-muted)" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: 260,
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-lg)',
                background: 'var(--glass-bg)',
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('recordings.type')}</InputLabel>
            <Select
              value={typeFilter}
              label={t('recordings.type')}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)' }}
            >
              <MenuItem value="">{t('recordings.allTypes')}</MenuItem>
              <MenuItem value="VIDEO">{t('recordings.VIDEO')}</MenuItem>
              <MenuItem value="AUDIO">{t('recordings.AUDIO')}</MenuItem>
              <MenuItem value="TRANSCRIPT">{t('recordings.TRANSCRIPT')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('recordings.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('recordings.status')}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)' }}
            >
              <MenuItem value="">{t('recordings.allStatuses')}</MenuItem>
              <MenuItem value="READY">{t('recordings.READY')}</MenuItem>
              <MenuItem value="PROCESSING">{t('recordings.PROCESSING')}</MenuItem>
              <MenuItem value="PENDING">{t('recordings.PENDING')}</MenuItem>
              <MenuItem value="FAILED">{t('recordings.FAILED')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Box
          sx={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#C99A5B' }} />
            </Box>
          ) : recordings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <HardDrive size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ color: 'var(--text-h)', mb: 1 }}>
                {t('recordings.noRecordings')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                {t('recordings.noRecordingsDesc')}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.conferenceName')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.type')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.duration')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.size')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.status')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.createdAt')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                        {t('recordings.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recordings.map((recording) => {
                      const statusConfig = getStatusConfig(recording.status);
                      return (
                        <TableRow key={recording.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-h)' }}>
                              {recording.conferenceName || recording.originalFilename || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'var(--text-muted)' }}>
                              {getTypeIcon(recording.recordingType)}
                              <Typography variant="body2">
                                {t(`recordings.${recording.recordingType}`)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'var(--text)' }}>
                              {formatDuration(recording.durationSeconds)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'var(--text)' }}>
                              {formatBytes(recording.fileSizeBytes)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={t(`recordings.${recording.status}`)}
                              sx={{
                                background: statusConfig.bgColor,
                                color: statusConfig.color,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                              {recording.createdAt
                                ? new Date(recording.createdAt).toLocaleDateString(
                                    i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                                  )
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              {recording.status === 'READY' && (
                                <Tooltip title={t('recordings.play')}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePlay(recording)}
                                    sx={{ color: '#0B7186' }}
                                  >
                                    <Play size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {recording.status === 'READY' && (
                                <Tooltip title={t('recordings.download')}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownload(recording)}
                                    sx={{ color: '#19B3C6' }}
                                  >
                                    <Download size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title={t('recordings.delete')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(recording)}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <Trash2 size={18} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
                sx={{ borderTop: '1px solid var(--glass-border)' }}
              />
            </>
          )}
        </Box>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-h)' }}>{t('recordings.delete')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text)' }}>
            {t('recordings.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'var(--text-muted)' }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: '#000',
            borderRadius: 'var(--radius-xl)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            background: '#111',
          }}
        >
          <Typography variant="h6">{t('recordings.play')}</Typography>
          <IconButton onClick={() => setPlayerOpen(false)} sx={{ color: '#fff' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, background: '#000' }}>
          {videoUrl && (
            <video
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '70vh', display: 'block' }}
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

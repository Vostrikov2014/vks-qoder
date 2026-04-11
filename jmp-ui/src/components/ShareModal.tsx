import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
} from '@mui/material';
import { Copy, X, Link, Clock } from 'lucide-react';
import { conferenceApi } from '../services/api';
import type { Conference } from '../types';

interface ShareModalProps {
  conference: Conference | null;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ conference, open, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    if (!conference) return;

    try {
      setLoading(true);
      setError(null);
      setCopied(false);

      const response = await conferenceApi.generateShareLink(conference.id, {
        displayName: 'Guest',
      });

      setShareUrl(response.data.shareUrl);
      setExpiresAt(response.data.expiresAt);
    } catch (err: any) {
      console.error('Failed to generate share link:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setExpiresAt(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  const formatExpiration = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-xl)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Link size={24} color="var(--text-h)" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
            Share Conference
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'var(--text-muted)',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {conference && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 0.5 }}>
              {conference.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
              {conference.roomName}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!shareUrl ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" sx={{ color: 'var(--text)', mb: 2 }}>
              Generate a shareable link that anyone can use to join this conference.
              The link will be valid for 4 hours.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Link size={18} />}
              onClick={handleGenerateLink}
              loading={loading}
              sx={{
                py: 1.5,
                px: 4,
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
              Generate Share Link
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success" sx={{ mb: 1, background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              Share link generated successfully!
            </Alert>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Clock size={14} color="var(--text-muted)" />
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                Expires: {formatExpiration(expiresAt)}
              </Typography>
            </Box>

            <TextField
              fullWidth
              value={shareUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleCopyLink}
                      sx={{
                        p: 1,
                        borderRadius: 'var(--radius-md)',
                        color: copied ? '#22c55e' : 'var(--text-muted)',
                        '&:hover': {
                          background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 182, 0.08)',
                          color: copied ? '#16a34a' : '#3b82b6',
                        },
                      }}
                    >
                      <Copy size={18} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
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

            {copied && (
              <Chip
                label="Link copied to clipboard!"
                size="small"
                sx={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#16a34a',
                  fontWeight: 600,
                  alignSelf: 'center',
                }}
              />
            )}

            <Alert severity="info" sx={{ mt: 1, background: 'rgba(59, 130, 182, 0.08)', color: '#3b82b6', border: '1px solid rgba(59, 130, 182, 0.2)' }}>
              <Typography variant="caption">
                <strong>How to use:</strong> Send this link to your friend. They can open it directly
                in their browser to join the conference without needing an account.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            textTransform: 'none',
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

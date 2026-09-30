import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { dialogButtonSx } from '../styles/dialogFields';

type ConfirmTone = 'danger' | 'primary';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  // 'danger' paints the confirm button red for destructive actions,
  // 'primary' uses the brand blue - same surfaces as the create/edit dialogs
  tone?: ConfirmTone;
}

const toneStyles: Record<ConfirmTone, { background: string; hover: string; disabled: string }> = {
  danger: {
    background: '#dc2626',
    hover: '#b91c1c',
    disabled: 'rgba(239, 68, 68, 0.35)',
  },
  primary: {
    background: 'var(--primary-600)',
    hover: 'var(--btn-hover-bg)',
    disabled: 'rgba(var(--primary-rgb), 0.35)',
  },
};

// Reusable confirmation dialog matching the project's modal styling; replaces
// the native browser window.confirm so destructive actions look consistent.
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading = false,
  tone = 'danger',
}: ConfirmDialogProps) => {
  const toneStyle = toneStyles[tone];

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Close only via the buttons or backdrop, keep it open while deleting
        if (reason !== 'backdropClick' || !loading) onClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: 'var(--bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'var(--text)' }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid var(--border)' }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            ...dialogButtonSx,
            color: 'var(--text)',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            ...dialogButtonSx,
            background: toneStyle.background,
            color: 'white',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            '&:hover': {
              background: toneStyle.hover,
            },
            '&.Mui-disabled': {
              background: toneStyle.disabled,
              color: 'white',
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

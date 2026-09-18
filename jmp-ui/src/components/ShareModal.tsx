import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Check, Clock, Copy, Link as LinkIcon, Plus, ShieldCheck, Trash2, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { conferenceLinkApi, extractApiError } from '../services/api';
import type { ConferenceLink, ConferenceLinkCreateRequest, ConferenceLinkRole } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Conference } from '../types';

interface ShareModalProps {
  conference: Conference | null;
  open: boolean;
  onClose: () => void;
}

const MODERATOR_ROLES = ['MODERATOR', 'TENANT_ADMIN', 'SUPER_ADMIN'];

const formatDateTime = (value: string | undefined, locale: string): string => {
  if (!value) return '';
  return new Date(value).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// datetime-local value -> ISO instant the backend can parse
const toInstant = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const isRevoked = (link: ConferenceLink): boolean => Boolean(link.revokedAt);

/**
 * Палитра MUI в проекте светлая (main.tsx), а тёмная тема переключается классом
 * html.dark, поэтому текст полей задаётся явно через CSS-переменные: иначе в тёмной
 * теме он остаётся чёрным и сливается с фоном диалога.
 */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-h)',
    '& input': { color: 'var(--text-h)' },
    '& input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
    '& fieldset': { borderColor: 'var(--border-strong)' },
    '&:hover fieldset': { borderColor: 'var(--text-muted)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--primary-600)', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-muted)',
    '&.Mui-focused': { color: 'var(--primary-600)' },
  },
};

/** Меню выбора роли — в тех же цветах, что и диалог, а не дефолтный белый Paper. */
const menuProps = {
  PaperProps: {
    sx: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--glass-border)',
      '& .MuiMenuItem-root': { color: 'var(--text-h)' },
      '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(var(--primary-rgb), 0.15)', color: 'var(--primary-600)' },
    },
  },
};

const isExpired = (link: ConferenceLink): boolean => {
  if (!link.expiresAt || link.revokedAt) return false;
  return new Date(link.expiresAt).getTime() < Date.now();
};

export default function ShareModal({ conference, open, onClose }: ShareModalProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [links, setLinks] = useState<ConferenceLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<ConferenceLinkRole>('PARTICIPANT');
  const [limited, setLimited] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const canModerate =
    MODERATOR_ROLES.some((roleName) => user?.roles?.includes(roleName)) ||
    Boolean(user && conference && user.id === conference.createdById);

  const fetchLinks = useCallback(async () => {
    if (!conference) return;
    try {
      setLoading(true);
      setError(null);
      const response = await conferenceLinkApi.getLinks(conference.id);
      setLinks(response.data);
    } catch (err: unknown) {
      setError(extractApiError(err, t('share.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [conference, t]);

  useEffect(() => {
    if (!open) return;
    setLabel('');
    setRole('PARTICIPANT');
    setLimited(false);
    setExpiresAt('');
    setCopiedId(null);
    fetchLinks();
  }, [open, fetchLinks]);

  const handleCopy = async (link: ConferenceLink) => {
    try {
      await navigator.clipboard.writeText(link.joinUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCreate = async () => {
    if (!conference) return;

    const request: ConferenceLinkCreateRequest = {
      label: label.trim() || undefined,
      role,
      expiresAt: limited ? toInstant(expiresAt) : undefined,
    };

    try {
      setSaving(true);
      setError(null);
      const response = await conferenceLinkApi.createLink(conference.id, request);
      setLinks((prev) => [...prev, response.data]);
      setLabel('');
      setRole('PARTICIPANT');
      setLimited(false);
      setExpiresAt('');
    } catch (err: unknown) {
      setError(extractApiError(err, t('share.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (link: ConferenceLink) => {
    if (!conference) return;

    try {
      setSaving(true);
      setError(null);
      await conferenceLinkApi.revokeLink(conference.id, link.id);
      setLinks((prev) =>
        prev.map((item) => (item.id === link.id ? { ...item, revokedAt: new Date().toISOString() } : item))
      );
    } catch (err: unknown) {
      setError(extractApiError(err, t('share.revokeFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setLinks([]);
    setError(null);
    setCopiedId(null);
    onClose();
  };

  const activeLinks = links.filter((link) => !isRevoked(link));
  const revokedLinks = links.filter((link) => isRevoked(link));

  const renderLink = (link: ConferenceLink, isPrimary: boolean) => {
    const expired = isExpired(link);
    const copied = copiedId === link.id;

    return (
      <Box
        key={link.id}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
            {link.label || t('share.unnamedLink')}
          </Typography>
          {isPrimary && (
            <Chip label={t('share.primaryBadge')} size="small" sx={{ background: 'rgba(var(--primary-rgb), 0.15)', color: 'var(--primary-600)', fontWeight: 600 }} />
          )}
          <Chip
            size="small"
            icon={link.role === 'MODERATOR' ? <ShieldCheck size={14} /> : <User size={14} />}
            label={t(`roles.${link.role}`)}
            sx={{
              background: link.role === 'MODERATOR' ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(107, 114, 128, 0.12)',
              color: link.role === 'MODERATOR' ? 'var(--primary-600)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          />
          {link.expiresAt && (
            <Chip
              size="small"
              icon={<Clock size={14} />}
              label={`${formatDateTime(link.expiresAt, i18n.language)}${expired ? ` · ${t('share.expiredBadge')}` : ''}`}
              sx={{
                background: expired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                color: expired ? '#dc2626' : 'var(--text-muted)',
                fontWeight: 600,
              }}
            />
          )}
          {isRevoked(link) && (
            <Chip
              size="small"
              label={t('share.revokedBadge')}
              sx={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontWeight: 600 }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
            {t('share.visits', { total: link.visitCount })}
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          value={link.joinUrl}
          aria-label={t('share.copyAriaLabel')}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleCopy(link)}
                  aria-label={t('share.copyAriaLabel')}
                  disabled={isRevoked(link) || expired}
                  sx={{
                    p: 1,
                    borderRadius: 'var(--radius-md)',
                    color: copied ? '#22c55e' : 'var(--text-muted)',
                    '&:hover': {
                      background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(var(--primary-rgb), 0.08)',
                      color: copied ? '#16a34a' : 'var(--primary-600)',
                    },
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              fontFamily: 'var(--mono)',
              fontSize: '0.8125rem',
              color: 'var(--text-h)',
              '& input': { color: 'var(--text-h)' },
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'var(--border)' },
            },
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
            {t('share.createdBy', { name: link.createdByName || '—', date: formatDateTime(link.createdAt, i18n.language) })}
          </Typography>
          {!isRevoked(link) && (
            <Tooltip title={t('share.revokeHint')}>
              <span>
                <Button
                  size="small"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => handleRevoke(link)}
                  disabled={saving || (!canModerate && (isPrimary || link.role === 'MODERATOR'))}
                  sx={{
                    borderRadius: 'var(--radius-md)',
                    color: '#dc2626',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { background: 'rgba(239, 68, 68, 0.08)' },
                    '&.Mui-disabled': { color: 'var(--text-muted)', opacity: 0.6 },
                  }}
                >
                  {t('share.revoke')}
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
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
          <LinkIcon size={24} color="var(--text-h)" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
            {t('share.title')}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          aria-label={t('common.close')}
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 0.5 }}>
              {conference.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
              {conference.roomName}
            </Typography>
          </Box>
        )}

        <Alert
          severity="info"
          sx={{
            mb: 3,
            background: 'rgba(var(--primary-rgb), 0.08)',
            color: 'var(--primary-600)',
            border: '1px solid rgba(var(--primary-rgb), 0.2)',
          }}
        >
          <Typography variant="caption">{t('share.howItWorks')}</Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: 'var(--primary-600)' }} />
          </Box>
        ) : (
          <>
            {activeLinks.map((link, index) => renderLink(link, index === 0))}

            {activeLinks.length === 0 && (
              <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 2 }}>
                {t('share.noLinks')}
              </Typography>
            )}

            {revokedLinks.length > 0 && (
              <>
                <Typography variant="overline" sx={{ color: 'var(--text-muted)' }}>
                  {t('share.revokedSection')}
                </Typography>
                {revokedLinks.map((link) => renderLink(link, false))}
              </>
            )}
          </>
        )}

        <Divider sx={{ my: 2, borderColor: 'rgba(var(--primary-rgb), 0.12)' }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 1.5 }}>
          {t('share.addLinkTitle')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label={t('share.linkLabel')}
            placeholder={t('share.linkLabelPlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={fieldSx}
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="link-role-label" sx={{ color: 'var(--text-muted)', '&.Mui-focused': { color: 'var(--primary-600)' } }}>
                {t('share.linkRole')}
              </InputLabel>
              <Select
                labelId="link-role-label"
                label={t('share.linkRole')}
                value={role}
                onChange={(e) => setRole(e.target.value as ConferenceLinkRole)}
                MenuProps={menuProps}
                sx={{
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-h)',
                  '& fieldset': { borderColor: 'var(--border-strong)' },
                  '&:hover fieldset': { borderColor: 'var(--text-muted)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-600)' },
                  '& .MuiSelect-icon': { color: 'var(--text-muted)' },
                }}
              >
                <MenuItem value="PARTICIPANT">{t('roles.PARTICIPANT')}</MenuItem>
                {canModerate && <MenuItem value="MODERATOR">{t('roles.MODERATOR')}</MenuItem>}
              </Select>
            </FormControl>
            <Box sx={{ minWidth: 240 }}>
              <FormControlLabel
                sx={{ '& .MuiFormControlLabel-label': { color: 'var(--text)' } }}
                control={
                  <Switch
                    checked={limited}
                    onChange={(e) => setLimited(e.target.checked)}
                    inputProps={{ 'aria-label': t('share.setExpiryAriaLabel') }}
                    sx={{
                      '& .MuiSwitch-switchBase': { color: 'var(--primary-600)' },
                      '& .MuiSwitch-track': { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', opacity: 1 },
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary-600)' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(var(--primary-rgb), 0.5)', opacity: 1 },
                    }}
                  />
                }
                label={t('share.setExpiry')}
              />
              {limited && (
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  label={t('share.expiresAt')}
                  sx={{ ...fieldSx, mt: 1 }}
                />
              )}
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={saving ? <CircularProgress size={16} /> : <Plus size={18} />}
              onClick={handleCreate}
              disabled={saving || (limited && !expiresAt)}
              sx={{
                borderRadius: 'var(--radius-lg)',
                borderColor: 'rgba(var(--primary-rgb), 0.4)',
                color: 'var(--primary-600)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: 'var(--primary-600)', background: 'rgba(var(--primary-rgb), 0.06)' },
                '&.Mui-disabled': { color: 'var(--text-muted)', borderColor: 'var(--border)' },
              }}
            >
              {t('share.addLinkButton')}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, borderTop: '1px solid rgba(var(--primary-rgb), 0.12)' }}>
        <Typography variant="caption" sx={{ color: 'var(--text-muted)', mr: 'auto' }}>
          {t('share.policyNote')}
        </Typography>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            textTransform: 'none',
          }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

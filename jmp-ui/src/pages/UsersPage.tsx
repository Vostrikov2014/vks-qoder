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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Mail,
  Shield,
  User,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { userApi } from '../services/api';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  createdAt: string;
}

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
        icon: <CheckCircle2 size={14} />,
        labelKey: 'common.active',
      };
    case 'PENDING_VERIFICATION':
      return {
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        icon: <Clock size={14} />,
        labelKey: 'common.pending',
      };
    case 'SUSPENDED':
      return {
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        icon: <AlertCircle size={14} />,
        labelKey: 'common.suspended',
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

const getRoleColor = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ROLE_SUPER_ADMIN':
      return '#3b82b6';
    case 'TENANT_ADMIN':
    case 'ROLE_TENANT_ADMIN':
      return '#2563eb';
    case 'MODERATOR':
    case 'ROLE_MODERATOR':
      return '#60a5fa';
    case 'PARTICIPANT':
    case 'ROLE_PARTICIPANT':
      return '#6b7280';
    default:
      return '#9ca3af';
  }
};

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleNames: [] as string[],
  });
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers({ search });
      setUsers(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roleNames: ['ROLE_PARTICIPANT'],
    });
    setOpenDialog(true);
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      roleNames: user.roles,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('users.deleteConfirm'))) {
      try {
        await userApi.deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await userApi.updateUser(editingUser.id, updateData);
      } else {
        await userApi.createUser(formData);
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAvatarGradient = (id: string) => {
    const gradients = [
      'linear-gradient(135deg, #3b82b6 0%, #2563eb 100%)',
      'linear-gradient(135deg, #60a5fa 0%, #3b82b6 100%)',
      'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
      'linear-gradient(135deg, #3b82b6 0%, #1d4ed8 100%)',
    ];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-h)', mb: 0.5 }}>
              {t('common.users')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
              {t('users.subtitle')}
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
            {t('users.addUser')}
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
            placeholder={t('users.searchPlaceholder')}
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

      {/* Users Cards Grid */}
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
            {users.map((user, index) => {
              const statusConfig = getStatusConfig(user.status);
              return (
                <motion.div
                  key={user.id}
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
                      gap: 2.5,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 'var(--shadow-xl)',
                      },
                    }}
                  >
                    {/* Header with Avatar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          background: getAvatarGradient(user.id),
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Mail size={12} color="var(--text-muted)" />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--mono)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
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

                    {/* Roles */}
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          mb: 1,
                        }}
                      >
                        {t('users.roles')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(user.roles || []).map((role) => (
                          <Chip
                            key={role}
                            size="small"
                            icon={<Shield size={12} />}
                            label={t(`roles.${role.replace('ROLE_', '')}`)}
                            sx={{
                              background: `${getRoleColor(role)}15`,
                              color: getRoleColor(role),
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: 'inherit',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Join Date */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(59, 130, 182, 0.08)',
                      }}
                    >
                      <User size={16} color="var(--text-muted)" />
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                        {t('users.joined')} {new Date(user.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit2 size={16} />}
                        onClick={() => handleEdit(user)}
                        sx={{
                          py: 1,
                          borderRadius: 'var(--radius-lg)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#3b82b6',
                            background: 'rgba(59, 130, 182, 0.08)',
                          },
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          onClick={() => handleDelete(user.id)}
                          sx={{
                            p: 1,
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            '&:hover': {
                              borderColor: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.08)',
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

      {/* Users List View */}
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
                  xs: '1fr 100px',
                  sm: '50px 1.5fr 1fr 120px 100px 100px',
                  md: '50px 1.5fr 1.5fr 150px 100px 100px 100px',
                },
                gap: 2,
                p: 2,
                borderBottom: '1px solid var(--border)',
                background: 'rgba(59, 130, 182, 0.04)',
              }}
            >
              <Box />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('users.firstName')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('users.email')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'block' } }}>
                {t('users.roles')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('common.active')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                {t('users.joined')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </Typography>
            </Box>

            {/* Table Rows */}
            <AnimatePresence>
              {users.map((user, index) => {
                const statusConfig = getStatusConfig(user.status);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr 100px',
                          sm: '50px 1.5fr 1fr 120px 100px 100px',
                          md: '50px 1.5fr 1.5fr 150px 100px 100px 100px',
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
                      {/* Avatar */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            background: getAvatarGradient(user.id),
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                      </Box>

                      {/* Full Name */}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>

                      {/* Email */}
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                        {user.email}
                      </Typography>

                      {/* Roles */}
                      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexWrap: 'wrap' }}>
                        {(user.roles || []).slice(0, 2).map((role) => (
                          <Chip
                            key={role}
                            size="small"
                            label={t(`roles.${role.replace('ROLE_', '')}`)}
                            sx={{
                              background: `${getRoleColor(role)}15`,
                              color: getRoleColor(role),
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 22,
                            }}
                          />
                        ))}
                        {(user.roles || []).length > 2 && (
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                            +{(user.roles || []).length - 2}
                          </Typography>
                        )}
                      </Box>

                      {/* Status */}
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

                      {/* Joined Date */}
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)', display: { xs: 'none', sm: 'block' } }}>
                        {new Date(user.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                      </Typography>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                            sx={{ p: 0.5, color: 'var(--text-muted)', '&:hover': { color: '#3b82b6' } }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(user.id)}
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
      {!loading && users.length === 0 && (
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
              <Users size={40} color="#3b82b6" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-h)', mb: 1 }}>
              {t('users.noUsers')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 3 }}>
              {t('users.noUsersDesc')}
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
              {t('users.addUser')}
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
            {editingUser ? t('users.editUser') : t('users.addUser')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('users.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            disabled={!!editingUser}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} color="var(--text-muted)" />
                </InputAdornment>
              ),
            }}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              fullWidth
              label={t('users.firstName')}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    borderColor: '#525252',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label={t('users.lastName')}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    borderColor: '#525252',
                  },
                },
              }}
            />
          </Box>
          {!editingUser && (
            <TextField
              fullWidth
              label={t('users.password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    borderColor: '#525252',
                  },
                },
              }}
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: 'var(--text-muted)' }}>{t('users.roles')}</InputLabel>
            <Select
              multiple
              value={formData.roleNames}
              onChange={(e) => setFormData({ ...formData, roleNames: e.target.value as string[] })}
              input={<OutlinedInput label={t('users.roles')} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as string[]).map((role) => (
                    <Chip
                      key={role}
                      size="small"
                      label={t(`roles.${role.replace('ROLE_', '')}`)}
                      sx={{
                        background: `${getRoleColor(role)}15`,
                        color: getRoleColor(role),
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              )}
              sx={{
                borderRadius: 'var(--radius-lg)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--border)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--border-strong)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82b6',
                },
              }}
            >
              <MenuItem value="ROLE_SUPER_ADMIN">{t('roles.SUPER_ADMIN')}</MenuItem>
              <MenuItem value="ROLE_TENANT_ADMIN">{t('roles.TENANT_ADMIN')}</MenuItem>
              <MenuItem value="ROLE_MODERATOR">{t('roles.MODERATOR')}</MenuItem>
              <MenuItem value="ROLE_PARTICIPANT">{t('roles.PARTICIPANT')}</MenuItem>
              <MenuItem value="ROLE_AUDITOR">{t('roles.AUDITOR')}</MenuItem>
            </Select>
          </FormControl>
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
            {editingUser ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu as MuiMenu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  LayoutDashboard,
  Video,
  Users,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Bell,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/', color: '#0ea5e9' },
  { text: 'Conferences', icon: Video, path: '/conferences', color: '#a855f7' },
  { text: 'Users', icon: Users, path: '/users', color: '#ec4899' },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed] = useState(false);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 50%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
          }}
        >
          <Video size={24} color="white" />
        </Box>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              JMP
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block' }}>
              Management Platform
            </Typography>
          </motion.div>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2, px: collapsed ? 1 : 2 }}>
        <Typography
          variant="caption"
          sx={{
            px: collapsed ? 0 : 2,
            py: 1,
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.7rem',
            display: collapsed ? 'none' : 'block',
          }}
        >
          Main Menu
        </Typography>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <motion.div
                key={item.text}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <ListItem disablePadding>
                  <Tooltip title={collapsed ? item.text : ''} placement="right">
                    <ListItemButton
                      selected={isActive}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 'var(--radius-lg)',
                        mx: collapsed ? 0.5 : 0,
                        py: 1.5,
                        minHeight: 48,
                        justifyContent: collapsed ? 'center' : 'initial',
                        px: collapsed ? 2 : 2,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': isActive
                          ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 4,
                              height: '60%',
                              borderRadius: '0 4px 4px 0',
                              background: item.color,
                            }
                          : {},
                        '&.Mui-selected': {
                          background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                          },
                        },
                        '&:hover': {
                          background: 'rgba(148, 163, 184, 0.08)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 40,
                          mr: collapsed ? 0 : 2,
                          color: isActive ? item.color : 'var(--text-muted)',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--text-h)' : 'var(--text)',
                            fontSize: '0.95rem',
                          }}
                        />
                      )}
                      {!collapsed && isActive && (
                        <ChevronRight size={16} color={item.color} />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </motion.div>
            );
          })}
        </List>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ p: 2, borderTop: '1px solid var(--border)' }}>
        <Tooltip title={collapsed ? 'Settings' : ''} placement="right">
          <ListItemButton
            sx={{
              borderRadius: 'var(--radius-lg)',
              justifyContent: collapsed ? 'center' : 'initial',
              py: 1.5,
              '&:hover': {
                background: 'rgba(148, 163, 184, 0.08)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 0 : 40,
                mr: collapsed ? 0 : 2,
                color: 'var(--text-muted)',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  fontWeight: 500,
                  color: 'var(--text)',
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* Mobile Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          px: 2,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          zIndex: 1200,
        }}
      >
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'var(--text-h)' }}>
          <MenuIcon size={24} color="currentColor" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            ml: 2,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          JMP
        </Typography>
      </Box>

      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { sm: collapsed ? 80 : DRAWER_WIDTH },
          flexShrink: { sm: 0 },
          display: { xs: 'none', sm: 'block' },
          transition: 'width 0.3s ease',
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              width: collapsed ? 80 : DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid var(--glass-border)',
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid var(--glass-border)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            px: { xs: 2, sm: 4 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
            mt: { xs: 8, sm: 0 },
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--text-h)' }}>
              {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              Welcome back, {user?.firstName || 'User'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: 'var(--text-muted)',
                  '&:hover': { color: 'var(--text-h)' },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 360 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </motion.div>
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  color: 'var(--text-muted)',
                  '&:hover': { color: 'var(--text-h)' },
                }}
              >
                <Bell size={20} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ borderColor: 'var(--border)' }} />

            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: 0.5,
                pr: 1.5,
                borderRadius: 'var(--radius-xl)',
                '&:hover': {
                  background: 'rgba(148, 163, 184, 0.08)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-h)' }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {user?.roles?.[0]?.replace('ROLE_', '') || 'User'}
                </Typography>
              </Box>
            </Box>

            <MuiMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-xl)',
                  minWidth: 180,
                },
              }}
            >
              <MenuItem
                onClick={handleLogout}
                sx={{
                  borderRadius: 'var(--radius-lg)',
                  mx: 1,
                  my: 0.5,
                  color: 'var(--text)',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                  },
                }}
              >
                <LogOut size={18} style={{ marginRight: 12 }} />
                Logout
              </MenuItem>
            </MuiMenu>
          </Box>
        </Box>

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 4 },
            overflow: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}

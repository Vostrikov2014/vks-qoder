import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  Tooltip,
} from '@mui/material';
import {
  LayoutDashboard,
  Video,
  Users,
  Building2,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Bell,
  ChevronRight,
  Sun,
  Moon,
  BarChart3,
  HardDrive,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const DRAWER_WIDTH = 280;
const HEADER_HEIGHT = 52;
// Top panel background, matched to the HomePage "Создать видео-встречу" tile (--lp-blue)
const HEADER_BLUE = '#2563eb';

const menuItems = [
  { textKey: 'common.dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'var(--sidebar-icon-active)', requiresAdmin: false, requiresSuperAdmin: false },
  { textKey: 'common.conferences', icon: Video, path: '/dashboard/conferences', color: 'var(--sidebar-icon-active)', requiresAdmin: false, requiresSuperAdmin: false },
  { textKey: 'common.analytics', icon: BarChart3, path: '/dashboard/analytics', color: 'var(--primary-500)', requiresAdmin: true, requiresSuperAdmin: false },
  { textKey: 'common.recordings', icon: HardDrive, path: '/dashboard/recordings', color: 'var(--sidebar-icon-active)', requiresAdmin: false, requiresSuperAdmin: false },
  { textKey: 'common.users', icon: Users, path: '/dashboard/users', color: 'var(--sidebar-icon-active)', requiresAdmin: true, requiresSuperAdmin: false },
  { textKey: 'common.tenants', icon: Building2, path: '/dashboard/tenants', color: 'var(--sidebar-icon-active)', requiresAdmin: false, requiresSuperAdmin: true },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, clearAuth } = useAuthStore();
  const canManageUsers = user?.roles?.some(
    (role) => role === 'ROLE_TENANT_ADMIN' || role === 'ROLE_SUPER_ADMIN'
  ) ?? false;
  const isSuperAdmin = user?.roles?.some((role) => role === 'ROLE_SUPER_ADMIN') ?? false;

  const filteredMenuItems = menuItems.filter(
    (item) => (!item.requiresAdmin || canManageUsers) && (!item.requiresSuperAdmin || isSuperAdmin)
  );
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
      {/* Navigation: the logo band moved into the unified full-width header,
          so the menu starts right at the top of the sidebar (no caption) */}
      <Box
        sx={{
          flex: 1,
          py: 2,
          px: collapsed ? 1 : 2,
          borderRight: '1px solid var(--sidebar-border-right)',
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {filteredMenuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <motion.div
                key={item.textKey}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <ListItem disablePadding>
                  <Tooltip title={collapsed ? t(item.textKey) : ''} placement="right">
                    <ListItemButton
                      selected={isActive}
                      onClick={() => {
                        navigate(item.path);
                        // The same content feeds the temporary (mobile) drawer:
                        // close it so the selected page becomes visible
                        setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 'var(--radius-lg)',
                        mx: collapsed ? 0.5 : 0,
                        py: 1,
                        minHeight: 40,
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
                              width: 0,
                              height: '60%',
                              borderRadius: '0 4px 4px 0',
                              background: item.color,
                            }
                          : {},
                        '&.Mui-selected': {
                          background: 'var(--sidebar-active-bg)',
                          '&:hover': {
                            background: 'var(--sidebar-active-bg-hover)',
                          },
                        },
                        '&:hover': {
                          background: 'var(--sidebar-hover-bg)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 40,
                          mr: collapsed ? 0 : 2,
                          color: isActive
                            ? 'var(--sidebar-icon-active)'
                            : 'var(--sidebar-icon)',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={t(item.textKey)}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 600 : 500,
                            color: isActive
                              ? 'var(--sidebar-item-text-active)'
                              : 'var(--sidebar-item-text)',
                            fontSize: '0.95rem',
                          }}
                        />
                      )}
                      {!collapsed && isActive && (
                        <ChevronRight size={16} color="var(--sidebar-icon-active)" />
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
      <Box
        sx={{
          p: 2,
          // No top divider: the block must read as part of the main menu list
          borderRight: '1px solid var(--sidebar-border-right)',
        }}
      >
        <Tooltip title={collapsed ? t('common.settings') : ''} placement="right">
          <ListItemButton
            sx={{
              borderRadius: 'var(--radius-lg)',
              justifyContent: collapsed ? 'center' : 'initial',
              // Same height as the main menu items (e.g. "Dashboard")
              py: 1,
              minHeight: 40,
              '&:hover': {
                background: 'var(--sidebar-hover-bg)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 0 : 40,
                mr: collapsed ? 0 : 2,
                color: 'var(--sidebar-icon)',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={t('common.settings')}
                primaryTypographyProps={{
                  fontWeight: 500,
                  color: 'var(--sidebar-item-text)',
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* Top Header: one band across the full viewport width - brand on the
          left, page title and controls to the right. The sidebar sits below,
          so the band forms a single continuous frame edge */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          // Above the drawer paper (z-index 1200): the band must stay on top
          // when the mobile menu opens over the sidebar column
          zIndex: 1300,
          px: { xs: 2, sm: 4 },
          flexShrink: 0,
          height: HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          background: HEADER_BLUE,
          // Decorative "aurora" layer: faint white radial gradients over the
          // brand blue, echoing the .aurora-bg on the login/landing pages
          // without introducing new colors
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: [
              'radial-gradient(ellipse 42% 130% at 30% 120%, rgba(255, 255, 255, 0.14) 0%, transparent 70%)',
              'radial-gradient(ellipse 30% 150% at 62% -40%, rgba(255, 255, 255, 0.12) 0%, transparent 70%)',
              'radial-gradient(ellipse 24% 150% at 88% 130%, rgba(255, 255, 255, 0.10) 0%, transparent 70%)',
            ].join(', '),
          },
        }}
      >
          {/* Mobile menu toggle: below sm the docked sidebar is hidden, so the
              temporary drawer is the only entry point to the main menu */}
          <IconButton
            onClick={handleDrawerToggle}
            aria-label={t('common.mainMenu')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              color: '#ffffff',
              ml: -1,
            }}
          >
            <MenuIcon size={24} color="currentColor" />
          </IconButton>

        {/* Brand block: hidden on phones (below sm) - the band there keeps
            only the menu toggle, page title and controls. The block is sized
            to the sidebar column so the page title after it can be offset to
            the content column's left edge */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 1,
            width: `calc(${DRAWER_WIDTH}px - 64px)`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              // Scaled-down rounding to match the smaller plate
              borderRadius: '0.375rem',
              // Inverted tile: white plate with the brand glyph, since the block itself is blue
              background: '#ffffff',
              color: HEADER_BLUE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={18} color="currentColor" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              // Inter is not bundled and the global stylesheet sets
              // `font-synthesis: none`, so a bold fallback face may not render;
              // re-enable synthesis for the wordmark only
              fontSynthesis: 'weight style',
              // Fallback fonts rarely ship a real 800 face, so the extra
              // weight is enforced with a hairline stroke of the same color
              WebkitTextStroke: '0.4px #ffffff',
              letterSpacing: '0.01em',
            }}
          >
            {t('common.appName')}
          </Typography>
        </Box>

        {/* Page title block. The sm left padding lands the title on the same
            vertical line as the page content (cards) below: 32 (band px) +
            216 (brand block) + 16 (flex gap) + 48 = 312 = 280 (sidebar) +
            32 (content padding) */}
        <Box sx={{ pl: { xs: 0, sm: 6 }, minWidth: 0 }}>
          {/* noWrap + ellipsis: long titles truncate on phones instead of clipping */}
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
            {t(filteredMenuItems.find((item) => item.path === location.pathname)?.textKey || 'common.dashboard')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, ml: 'auto' }}>
          {/* Language Toggle */}
          <Tooltip title={t('common.language')}>
              <IconButton
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')}
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  '&:hover': { color: '#ffffff' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                  {i18n.language === 'en' ? 'RU' : 'EN'}
                </Typography>
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  '&:hover': { color: '#ffffff' },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 360 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </IconButton>
            </Tooltip>

            <Tooltip title={t('common.notifications')}>
              <IconButton
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  '&:hover': { color: '#ffffff' },
                }}
              >
                <Bell size={20} />
              </IconButton>
            </Tooltip>

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
                  background: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  // Same inversion as the sidebar logo: white plate, blue initials on the blue header
                  background: '#ffffff',
                  color: HEADER_BLUE,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  {user?.firstName} {user?.lastName}
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
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: '#171717',
                  },
                }}
              >
                <LogOut size={18} style={{ marginRight: 12 }} />
                {t('common.logout')}
              </MenuItem>
            </MuiMenu>
          </Box>
      </Box>

      {/* Below the band: sidebar column and page content side by side */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Desktop Sidebar: docked under the header band. The paper is pinned
            to the viewport below the band instead of MUI's default fixed
            top: 0, so it never overlays the blue panel */}
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', sm: 'flex' } }}
          PaperProps={{
            sx: {
              position: 'fixed',
              top: HEADER_HEIGHT,
              bottom: 0,
              height: 'auto',
              width: collapsed ? 80 : DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: 'var(--sidebar-bg)',
              borderRight: 'none',
              transition: 'width 0.3s ease',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Spacer reserving the sidebar column inside the row (the paper above
            is fixed, so it does not take up flow space on its own) */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: collapsed ? 80 : DRAWER_WIDTH,
            flexShrink: 0,
            transition: 'width 0.3s ease',
          }}
        />

        {/* Mobile Drawer: opens beneath the band, mirroring the desktop dock */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              top: HEADER_HEIGHT,
              bottom: 0,
              height: 'auto',
              width: DRAWER_WIDTH,
              // Narrow phones: keep the drawer from covering the whole viewport
              maxWidth: '85vw',
              background: 'var(--sidebar-bg)',
              borderRight: 'none',
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
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* Page Content: its height tracks the header band exactly, so the
              scrollbar starts right below the band instead of running up
              over it */}
          <Box
            sx={{
              height: `calc(100dvh - ${HEADER_HEIGHT}px)`,
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
    </Box>
  );
}

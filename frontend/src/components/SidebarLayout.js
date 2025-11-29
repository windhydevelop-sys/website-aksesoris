import React, { useState } from 'react';
import { Drawer, Toolbar, Box, List, ListItem, ListItemIcon, ListItemText, ListItemButton, AppBar, Avatar, Typography, Chip, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Dashboard as DashboardIcon, Logout, PeopleAlt, Info, Group, Android, AdminPanelSettings, AccountCircle, Menu as MenuIcon, AddShoppingCart, AccountBalanceWallet, Backup } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const SidebarLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get current user data
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const user = getCurrentUser();
  const userRole = user.role || 'user';
  const menuPermissions = user.menuPermissions || {};

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const logout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // fallback: clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (pathPrefix) => location.pathname.startsWith(pathPrefix);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar with User Info */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'primary.main',
          zIndex: 1100
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <AccountCircle />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>
                {user.username || 'User'}
              </Typography>
              <Chip
                label={userRole === 'user' ? 'Karyawan' : userRole === 'moderator' ? 'Member' : 'Admin'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', // gradient background
            color: '#fff',
            boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {(userRole === 'admin' || menuPermissions.dashboard) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/dashboard')}
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Input Product" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.inputProduct) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/product-details')}
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Info /></ListItemIcon>
                  <ListItemText primary="Detail Produk (via Dashboard)" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.customers) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/customers')}
                  onClick={() => navigate('/customers')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><PeopleAlt /></ListItemIcon>
                  <ListItemText primary="Customer" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {userRole === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/field-staff-management')}
                  onClick={() => navigate('/field-staff-management')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Group /></ListItemIcon>
                  <ListItemText primary="Kelola Orlap" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || user.fieldStaff) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/field-staff-dashboard')}
                  onClick={() => navigate('/field-staff-dashboard')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard Orlap" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.orders) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/orders')}
                  onClick={() => navigate('/orders')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><AddShoppingCart /></ListItemIcon>
                  <ListItemText primary="Order Management" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.cashflow) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/cashflow')}
                  onClick={() => navigate('/cashflow')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><AccountBalanceWallet /></ListItemIcon>
                  <ListItemText primary="Cashflow" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.complaints) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/complaints')}
                  onClick={() => navigate('/complaints')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Info /></ListItemIcon>
                  <ListItemText primary="Komplain" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {(userRole === 'admin' || menuPermissions.handphone) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/handphone')}
                  onClick={() => navigate('/handphone')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Android /></ListItemIcon>
                  <ListItemText primary="Detail Handphone" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {userRole === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/backup')}
                  onClick={() => navigate('/backup')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Backup /></ListItemIcon>
                  <ListItemText primary="Database Backup" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            {userRole === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/users')}
                  onClick={() => navigate('/users')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><AdminPanelSettings /></ListItemIcon>
                  <ListItemText primary="User Management" sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton
                onClick={logout}
                sx={{
                  color: 'inherit',
                  borderRadius: 2,
                  mx: 1,
                  '&:hover': { bgcolor: 'rgba(255,0,0,0.1)' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}><Logout /></ListItemIcon>
                <ListItemText primary="Logout" sx={{ color: 'inherit' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: 8,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SidebarLayout;
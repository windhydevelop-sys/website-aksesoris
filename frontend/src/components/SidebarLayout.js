import React from 'react';
import { Drawer, Toolbar, Box, List, ListItem, ListItemIcon, ListItemText, ListItemButton, AppBar, Avatar, Typography, Chip } from '@mui/material';
import { Dashboard as DashboardIcon, Logout, PeopleAlt, Info, Group, Android, AdminPanelSettings, AccountCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const SidebarLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'primary.main',
          zIndex: 1100
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <AccountCircle />
            </Avatar>
            <Box>
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
        variant="permanent"
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
            {(userRole === 'admin' || menuPermissions.fieldStaff) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive('/field-staff')}
                  onClick={() => navigate('/field-staff')}
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}><Group /></ListItemIcon>
                  <ListItemText primary="Orang Lapangan" sx={{ color: 'inherit' }} />
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
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

export default SidebarLayout;
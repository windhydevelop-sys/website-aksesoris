import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, Chip, Switch, FormControlLabel, Tabs, Tab
} from '@mui/material';
import { Settings, Save, Refresh } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const MenuPermissionsManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  const roles = ['admin', 'field_staff', 'user'];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/menu-permissions');
      setPermissions(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to fetch menu permissions');
      showError('Failed to fetch menu permissions');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handlePermissionToggle = (menuKey, isEnabled) => {
    const key = `${selectedRole}_${menuKey}`;
    setPendingChanges(prev => ({
      ...prev,
      [key]: { menuKey, isEnabled, role: selectedRole }
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const changes = Object.values(pendingChanges);
      if (changes.length === 0) return;

      const response = await axios.put(`/api/menu-permissions/bulk/role/${selectedRole}`, {
        role: selectedRole,
        permissions: changes
      });

      showSuccess(`Menu permissions updated for ${selectedRole}`);
      setPendingChanges({});
      setHasChanges(false);
      fetchPermissions();
    } catch (err) {
      console.error('Error saving permissions:', err);
      showError('Failed to save menu permissions');
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm('This will reset all menu permissions to default values. Continue?')) {
      return;
    }

    try {
      await axios.post('/api/menu-permissions/initialize');
      showSuccess('Default menu permissions initialized');
      fetchPermissions();
    } catch (err) {
      console.error('Error initializing permissions:', err);
      showError('Failed to initialize default permissions');
    }
  };

  const getCurrentPermissionValue = (menuKey) => {
    const key = `${selectedRole}_${menuKey}`;
    if (pendingChanges[key]) {
      return pendingChanges[key].isEnabled;
    }

    const rolePermissions = permissions[selectedRole] || [];
    const permission = rolePermissions.find(p => p.menuKey === menuKey);
    return permission ? permission.isEnabled : false;
  };

  const getRolePermissions = () => {
    return permissions[selectedRole] || [];
  };

  const getRoleDisplayName = (role) => {
    const names = {
      admin: 'Administrator',
      field_staff: 'Field Staff',
      user: 'Regular User'
    };
    return names[role] || role;
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            Menu Permissions Management
          </Typography>
        </Box>

        {/* Role Tabs */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Role to Manage
            </Typography>
            <Tabs
              value={selectedRole}
              onChange={(e, newValue) => {
                if (hasChanges && !window.confirm('You have unsaved changes. Switch role anyway?')) {
                  return;
                }
                setSelectedRole(newValue);
                setPendingChanges({});
                setHasChanges(false);
              }}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {roles.map((role) => (
                <Tab
                  key={role}
                  label={getRoleDisplayName(role)}
                  value={role}
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleInitializeDefaults}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Save Changes
          </Button>
        </Box>

        {hasChanges && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You have unsaved changes. Click "Save Changes" to apply them.
          </Alert>
        )}

        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Menu Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Icon</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sort Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Enabled</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getRolePermissions().map((permission) => (
                  <TableRow key={permission.menuKey} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {permission.menuName}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {permission.path}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permission.icon || 'No Icon'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {permission.sortOrder}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permission.isEnabled ? 'Enabled' : 'Disabled'}
                        color={permission.isEnabled ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={getCurrentPermissionValue(permission.menuKey)}
                            onChange={(e) => handlePermissionToggle(permission.menuKey, e.target.checked)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {getRolePermissions().length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No menu permissions found for {getRoleDisplayName(selectedRole)}.
                Click "Reset to Defaults" to initialize default permissions.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Info Card */}
        <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Typography variant="h6" color="info.contrastText" gutterBottom>
              ℹ️ How Menu Permissions Work
            </Typography>
            <Typography variant="body2" color="info.contrastText">
              • Toggle switches control which menus are visible for each role<br/>
              • Changes are saved per role and applied immediately<br/>
              • "Reset to Defaults" restores the recommended menu configuration<br/>
              • Admin can always access all menus regardless of these settings
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default MenuPermissionsManagement;
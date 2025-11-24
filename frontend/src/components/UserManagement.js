import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Alert, Card, Grid, Pagination,
  Tabs, Tab, FormControlLabel, Switch, useMediaQuery, useTheme
} from '@mui/material';
import { Edit, Delete, PersonAdd, Block, CheckCircle } from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import SidebarLayout from './SidebarLayout';

const UserManagement = () => {
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    menuPermissions: {
      dashboard: true,
      inputProduct: false,
      customers: false,
      fieldStaff: false,
      complaints: false,
      handphone: false
    }
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabIndex, setTabIndex] = useState(0);

  const token = localStorage.getItem('token');

  const fetchUsers = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getDefaultPermissions = (role) => {
    switch (role) {
      case 'admin':
        return {
          dashboard: true,
          inputProduct: true,
          customers: true,
          fieldStaff: true,
          complaints: true,
          handphone: true
        };
      case 'moderator':
        return {
          dashboard: true,
          inputProduct: true,
          customers: true,
          fieldStaff: false,
          complaints: false,
          handphone: false
        };
      case 'user':
      default:
        return {
          dashboard: true,
          inputProduct: false,
          customers: false,
          fieldStaff: false,
          complaints: false,
          handphone: false
        };
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditing(user._id);
      const userRole = user.role || 'user';
      setForm({
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't prefill password
        role: userRole,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        menuPermissions: user.menuPermissions || getDefaultPermissions(userRole)
      });
    } else {
      setEditing(null);
      setForm({
        username: '',
        email: '',
        password: '',
        role: 'user',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        menuPermissions: getDefaultPermissions('user')
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role') {
      // Handle role change with auto-set permissions
      let newPermissions = { ...form.menuPermissions };

      if (value === 'admin') {
        newPermissions = {
          dashboard: true,
          inputProduct: true,
          customers: true,
          fieldStaff: true,
          complaints: true,
          handphone: true
        };
      } else if (value === 'user') {
        // Karyawan gets limited permissions
        newPermissions = {
          dashboard: true,
          inputProduct: false,
          customers: false,
          fieldStaff: false,
          complaints: false,
          handphone: false
        };
      } else if (value === 'moderator') {
        // Member gets some permissions
        newPermissions = {
          dashboard: true,
          inputProduct: true,
          customers: true,
          fieldStaff: false,
          complaints: false,
          handphone: false
        };
      }

      setForm({
        ...form,
        role: value,
        menuPermissions: newPermissions
      });
    } else {
      // Handle other field changes
      setForm({ ...form, [name]: value });
    }
  };

  const handlePermissionChange = (permission) => (e) => {
    setForm({
      ...form,
      menuPermissions: {
        ...form.menuPermissions,
        [permission]: e.target.checked
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password length for new users
    if (!editing && form.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    try {
      if (editing) {
        await axios.put(`/api/users/${editing}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('User updated successfully');
      } else {
        await axios.post('/api/users', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('User created successfully');
      }
      handleClose();
      fetchUsers(page);
    } catch (err) {
      showError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('User deleted successfully');
      fetchUsers(page);
    } catch (err) {
      showError('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.post(`/api/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(page);
    } catch (err) {
      showError('Failed to toggle user status');
    }
  };

  const handlePageChange = (event, value) => {
    fetchUsers(value);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      default: return 'default';
    }
  };

  if (loading && users.length === 0) {
    return (
      <SidebarLayout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Typography>Loading users...</Typography>
          </Box>
        </Container>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Container maxWidth="lg">
        <Box sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
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
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => handleOpen()}
              sx={{
                borderRadius: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Add User
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100, display: { xs: 'none', md: 'table-cell' } }}>Last Login</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100, display: { xs: 'none', sm: 'table-cell' } }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </TableCell>
                      <TableCell>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'user' ? 'Karyawan' : user.role === 'moderator' ? 'Member' : 'Admin'}
                          color={getRoleColor(user.role)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {user.lastLogin ? (
                          <Chip
                            label={new Date(user.lastLogin).toLocaleDateString('id-ID')}
                            color="info"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Never"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            color={user.isActive ? 'warning' : 'success'}
                            size="small"
                          >
                            {user.isActive ? <Block /> : <CheckCircle />}
                          </IconButton>
                          <IconButton onClick={() => handleDelete(user._id)} color="error" size="small">
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Card>

          {/* Add/Edit User Dialog */}
          <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
          >
            <DialogTitle sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}>
              {editing ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 2 }}>
                  <Tab label="Basic Info" />
                  <Tab label="Profile" />
                  <Tab label="Menu Permissions" />
                </Tabs>

                {tabIndex === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        margin="normal"
                      />
                    </Grid>
                    {!editing && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Password"
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={handleChange}
                          required={!editing}
                          margin="normal"
                          helperText="Password must be at least 8 characters long"
                          inputProps={{ minLength: 8 }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          label="Role"
                        >
                          <MenuItem value="user">Karyawan</MenuItem>
                          <MenuItem value="moderator">Member</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {tabIndex === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                )}

                {tabIndex === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Menu Access Permissions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Toggle on/off menu items that this user can access
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.dashboard}
                              onChange={handlePermissionChange('dashboard')}
                              color="primary"
                            />
                          }
                          label="Dashboard"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.inputProduct}
                              onChange={handlePermissionChange('inputProduct')}
                              color="primary"
                            />
                          }
                          label="Input Product"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.customers}
                              onChange={handlePermissionChange('customers')}
                              color="primary"
                            />
                          }
                          label="Customer"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.fieldStaff}
                              onChange={handlePermissionChange('fieldStaff')}
                              color="primary"
                            />
                          }
                          label="Orang Lapangan"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.complaints}
                              onChange={handlePermissionChange('complaints')}
                              color="primary"
                            />
                          }
                          label="Komplain"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.menuPermissions.handphone}
                              onChange={handlePermissionChange('handphone')}
                              color="primary"
                            />
                          }
                          label="Detail Handphone"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained">
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </Box>
      </Container>
    </SidebarLayout>
  );
};

export default UserManagement;
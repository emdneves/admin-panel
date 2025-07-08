import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Button, AppBar, Toolbar, Chip, IconButton, Paper, List, ListItem, ListItemText, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NightlightIcon from '@mui/icons-material/Nightlight';
import LightModeIcon from '@mui/icons-material/LightMode';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import api from '../../services/api';
import EntityTable from '../Table/EntityTable';
import { useTheme } from '@mui/material/styles';

interface UsersPageProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ mode, setMode }) => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState(true);
  const theme = useTheme();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await api.checkHealth();
      setServerHealthy(healthy);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  // Get all user types (roles)
  const userTypes = React.useMemo(() => {
    const types = new Set<string>();
    users.forEach(u => u.role && types.add(u.role));
    return Array.from(types).sort();
  }, [users]);

  const filteredUsers = selectedType ? users.filter(u => u.role === selectedType) : users;

  // Prepare columns for EntityTable
  const columns = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      editable: true,
      renderCell: (params: any) => (
        <span style={{
          display: 'block',
          width: '100%',
          background: theme.palette.mode === 'dark' ? '#181818' : '#fafbfc',
          border: params.hasFocus ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 12,
          padding: '2px 8px',
          minHeight: 24,
          fontSize: 13,
          color: theme.palette.mode === 'dark' ? '#fff' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{params.value}</span>
      ),
    },
    {
      field: 'first_name',
      headerName: 'First Name',
      flex: 1,
      editable: true,
      renderCell: (params: any) => (
        <span style={{
          display: 'block',
          width: '100%',
          background: theme.palette.mode === 'dark' ? '#181818' : '#fafbfc',
          border: params.hasFocus ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 12,
          padding: '2px 8px',
          minHeight: 24,
          fontSize: 13,
          color: theme.palette.mode === 'dark' ? '#fff' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{params.value}</span>
      ),
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      editable: true,
      renderCell: (params: any) => (
        <span style={{
          display: 'block',
          width: '100%',
          background: theme.palette.mode === 'dark' ? '#181818' : '#fafbfc',
          border: params.hasFocus ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 12,
          padding: '2px 8px',
          minHeight: 24,
          fontSize: 13,
          color: theme.palette.mode === 'dark' ? '#fff' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{params.value}</span>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['admin', 'user'],
      renderCell: (params: any) => (
        <span style={{
          display: 'block',
          width: '100%',
          background: theme.palette.mode === 'dark' ? '#181818' : '#fafbfc',
          border: params.hasFocus ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 12,
          padding: '2px 8px',
          minHeight: 24,
          fontSize: 13,
          color: theme.palette.mode === 'dark' ? '#fff' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{params.value}</span>
      ),
    },
    { field: 'id', headerName: 'User ID', flex: 0.7 },
    {
      field: 'is_active',
      headerName: 'Active',
      flex: 0.7,
      editable: true,
      type: 'singleSelect',
      valueOptions: [true, false],
      renderCell: (params: any) => (
        <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'default'} size="small" />
      ),
    },
    { field: 'created_at', headerName: 'Created At', flex: 1, valueGetter: (params: any) => params.row.created_at ? new Date(params.row.created_at).toLocaleString() : '' },
    { field: 'updated_at', headerName: 'Updated At', flex: 1, valueGetter: (params: any) => params.row.updated_at ? new Date(params.row.updated_at).toLocaleString() : '' },
    { field: 'last_login', headerName: 'Last Login', flex: 1, valueGetter: (params: any) => params.row.last_login ? new Date(params.row.last_login).toLocaleString() : '' },
  ];

  // Inline editing handler
  const processRowUpdate = async (newRow: any, oldRow: any) => {
    try {
      // Always send all required fields
      const updated = await api.updateUser(newRow.id, {
        email: newRow.email,
        role: newRow.role,
        first_name: newRow.first_name,
        last_name: newRow.last_name,
        is_active: newRow.is_active,
      });
      // Optionally, merge backend response for consistency
      fetchUsers();
      return { ...newRow, ...updated };
    } catch (e) {
      // Optionally show error
      return oldRow;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Bar */}
      <AppBar position="static" elevation={0} sx={{ zIndex: 1201, mb: 1 }}>
        <Toolbar>
          <PeopleIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            User Management
          </Typography>
          <Chip
            icon={<RocketLaunchIcon />}
            label={serverHealthy ? 'Server Online' : 'Server Offline'}
            color={serverHealthy ? 'success' : 'error'}
            size="small"
            sx={{ mr: 1, fontWeight: 600 }}
          />
          <IconButton color="inherit" onClick={fetchUsers} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            sx={{
              ml: 1,
              bgcolor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(6px)',
              borderRadius: '50%',
              transition: 'background 0.2s',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.18)',
              },
              color: 'inherit',
              boxShadow: mode === 'dark' ? '0 2px 8px 0 rgba(0,0,0,0.15)' : '0 2px 8px 0 rgba(0,0,0,0.05)',
            }}
            size="large"
          >
            {mode === 'dark' ? <LightModeIcon /> : <NightlightIcon />}
          </IconButton>
          <Button color="inherit" onClick={() => navigate('/')} sx={{ ml: 2 }}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {/* Layout: Sidebar + Main */}
      <Box sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 64px)', gap: 2, flex: 1 }}>
          {/* Sidebar: User Types */}
          <Box sx={{ width: { xs: '20%', sm: '15%', md: '12.5%', lg: '12.5%', xl: '12.5%' }, flexShrink: 0, overflow: 'auto', flex: 1 }}>
            <Paper
              sx={{ p: 1, borderRadius: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
              elevation={1}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }} />
              <List>
                <ListItem button selected={selectedType === null} onClick={() => setSelectedType(null)} sx={{ borderRadius: 1 }}>
                  <ListItemText primary="All" />
                </ListItem>
                {userTypes.map(type => (
                  <ListItem button key={type} selected={selectedType === type} onClick={() => setSelectedType(type)} sx={{ borderRadius: 1 }}>
                    <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
          {/* Main Content: User Info Table */}
          <Box sx={{ width: { xs: '80%', sm: '85%', md: '87.5%', lg: '87.5%', xl: '87.5%' }, overflow: 'auto' }}>
            <Paper
              sx={{ p: 1, borderRadius: 1, display: 'flex', flexDirection: 'column' }}
              elevation={1}
            >
              <Typography variant="h5" fontWeight={700} mb={2}>All Users</Typography>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              <EntityTable
                columns={columns}
                rows={filteredUsers}
                loading={loading}
                density="compact"
                tableBorder={true}
                showRowNumber={true}
                processRowUpdate={processRowUpdate}
                experimentalFeatures={{ newEditingApi: true }}
                sx={{ bgcolor: theme.palette.mode === 'dark' ? '#111' : 'background.paper' }}
              />
              {filteredUsers.length === 0 && <Typography sx={{ mt: 2 }}>No users found for this type.</Typography>}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default UsersPage; 
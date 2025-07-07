import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, InputAdornment, IconButton, List, ListItem, ListItemText, Chip, AppBar, Toolbar, Button, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightlightIcon from '@mui/icons-material/Nightlight';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EntityTable, { EntityTableProps } from './Table/EntityTable';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreeView, TreeItem } from '@mui/lab';

interface ActivityLogPageProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'timestamp', headerName: 'Timestamp', width: 180, valueGetter: (params: any) => new Date(params.row.timestamp).toLocaleString() },
  { field: 'user', headerName: 'User', width: 180, valueGetter: (params: any) => params.row.user?.email || 'System' },
  { field: 'action', headerName: 'Action', width: 100 },
  { field: 'target', headerName: 'Target', width: 120 },
  { field: 'targetId', headerName: 'Target ID', width: 180 },
  { field: 'metadata', headerName: 'Metadata', width: 600, renderCell: (params: any) => <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(params.row.metadata, null, 2)}</pre> },
];

const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ mode, setMode }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState(true);
  const [contentItemsByType, setContentItemsByType] = useState<Record<string, any[]>>({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: page + 1,
        pageSize,
        userId: userId || undefined,
        actionType: actionType || undefined,
        startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
        endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
      };
      const { logs, total } = await api.getActivityLogs(params);
      setLogs(logs);
      setTotal(total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userId, actionType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    // Fetch users for filter dropdown
    api.listUsers().then(setUsers).catch(() => setUsers([]));
    // Fetch content types for sidebar
    api.listContentTypes().then(async (types) => {
      setContentTypes(types);
      // For each type, fetch its content items
      const itemsByType: Record<string, any[]> = {};
      for (const ct of types) {
        try {
          const items = await api.listContent(ct.id);
          itemsByType[ct.name] = items;
        } catch {
          itemsByType[ct.name] = [];
        }
      }
      setContentItemsByType(itemsByType);
    }).catch(() => setContentTypes([]));
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await api.checkHealth();
      setServerHealthy(healthy);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter logs based on selected type/content
  const filteredLogs = React.useMemo(() => {
    if (!selectedType && !selectedContent) return logs;
    if (selectedType) {
      // Find the content type name for the selected id
      const ct = contentTypes.find(ct => ct.id === selectedType);
      if (!ct) return [];
      return logs.filter(log => log.metadata?.content_type_name === ct.name);
    }
    if (selectedContent) {
      return logs.filter(log => log.metadata?.content_id === selectedContent);
    }
    return logs;
  }, [logs, selectedType, selectedContent, contentTypes]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Full-width Navbar at the top */}
      <AppBar position="static" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, mb: 1 }}>
        <Toolbar sx={{ gap: 2, minHeight: 64 }}>
          <ListAltIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Activity Log
          </Typography>
          <Chip
            icon={<RocketLaunchIcon />}
            label={serverHealthy ? 'Server Online' : 'Server Offline'}
            color={serverHealthy ? 'success' : 'error'}
            size="small"
            sx={{ mr: 1, fontWeight: 600 }}
          />
          <IconButton color="inherit" onClick={fetchLogs} disabled={loading} sx={{ mr: 1 }}>
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
          <Button color="inherit" startIcon={<DashboardIcon />} sx={{ ml: 1 }} onClick={() => navigate('/')}>
            Dashboard
          </Button>
          <Button color="inherit" startIcon={<PeopleIcon />} sx={{ ml: 1 }} onClick={() => navigate('/users')}>
            Users
          </Button>
          <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Layout: Sidebar + Main */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 64px)', gap: 2 }}>
          {/* Sidebar: Content Types and Content Items */}
          <Box sx={{ width: { xs: '20%', sm: '15%', md: '12.5%', lg: '12.5%', xl: '12.5%' }, flexShrink: 0, overflow: 'auto' }}>
            <Paper sx={{ p: 1, borderRadius: 1, display: 'flex', flexDirection: 'column' }} elevation={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }} />
              <List>
                <ListItem button selected={selectedType === null && selectedContent === null} onClick={() => { setSelectedType(null); setSelectedContent(null); }} sx={{ borderRadius: 1 }}>
                  <ListItemText primary="All Activity" />
                </ListItem>
              </List>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}>
                Content Types
              </Typography>
              <List>
                {contentTypes.map((ct) => (
                  <ListItem
                    button
                    key={ct.id}
                    selected={selectedType === ct.id && !selectedContent}
                    onClick={() => { setSelectedType(ct.id); setSelectedContent(null); }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText primary={ct.name || ct.id} secondary={ct.id} />
                  </ListItem>
                ))}
              </List>
              {selectedType && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}>
                    Content Items
                  </Typography>
                  <List>
                    {(contentItemsByType[contentTypes.find(ct => ct.id === selectedType)?.name] || []).map(item => (
                      <ListItem
                        button
                        key={item.id}
                        selected={selectedContent === item.id}
                        onClick={() => { setSelectedContent(item.id); }}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText primary={item.id} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Box>

          {/* Main content area */}
          <Box sx={{ width: { xs: '80%', sm: '85%', md: '87.5%', lg: '87.5%', xl: '87.5%' }, overflow: 'auto' }}>
            <Paper sx={{ p: 1, borderRadius: 1, display: 'flex', flexDirection: 'column' }} elevation={1}>
              <Typography variant="h5" fontWeight={700} mb={2}>Activity Log</Typography>
              
              {/* Filters */}
              <Paper sx={{ p: 2, mb: 2, borderRadius: 1, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }} elevation={1}>
                <TextField
                  select
                  label="User"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.email}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Action Type"
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  {ACTION_TYPES.map(a => (
                    <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                  ))}
                </TextField>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
                />
                <IconButton onClick={() => { setPage(0); fetchLogs(); }} size="small" sx={{ ml: 1 }}>
                  <SearchIcon />
                </IconButton>
              </Paper>

              {/* Selected filters display */}
              {(selectedType || selectedContent) && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedType && (
                    <Chip 
                      label={`Type: ${selectedType}`} 
                      onDelete={() => setSelectedType(null)} 
                      size="small" 
                      color="primary" 
                    />
                  )}
                  {selectedContent && (
                    <Chip 
                      label={`Content: ${selectedContent}`} 
                      onDelete={() => setSelectedContent(null)} 
                      size="small" 
                      color="secondary" 
                    />
                  )}
                </Box>
              )}

              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              <EntityTable
                columns={columns}
                rows={filteredLogs}
                loading={loading}
                density="compact"
                tableBorder={true}
                showRowNumber={true}
                sx={{ minHeight: 400 }}
                getRowHeight={(params) => {
                  // MUI DataGrid passes params.model for the row data
                  const metadata = params.model && params.model.metadata ? JSON.stringify(params.model.metadata, null, 2) : '';
                  const lines = metadata.split('\n').length;
                  return Math.max(56, 20 * lines + 24);
                }}
              />
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityLogPage; 
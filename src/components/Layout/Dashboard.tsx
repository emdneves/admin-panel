import React, { useEffect, useState, PropsWithChildren, ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Menu,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Brightness7 as Brightness7Icon,
  Brightness4 as Brightness4Icon,
  LightMode as LightModeIcon,
  Nightlight as NightlightIcon,
  RocketLaunch as RocketLaunchIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { useContent } from '../../hooks/useContent';
import ContentList from '../Content/ContentList';
import ContentForm from '../Content/ContentForm';
import ContentDetail from '../Content/ContentDetail';
import { FieldType, ContentType, ContentField, ContentItem } from '../../types';
import api from '../../services/api';
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid';
import EntityTable from '../Table/EntityTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DashboardPanelProps {
  buttonLabel: string;
  buttonOnClick: () => void;
  buttonDisabled?: boolean;
  buttonStartIcon?: ReactNode;
  buttonSx?: any;
  tableProps: any;
}

const DashboardPanel: React.FC<PropsWithChildren<DashboardPanelProps>> = ({ buttonLabel, buttonOnClick, buttonDisabled, buttonStartIcon, buttonSx, tableProps, children }) => (
  <Paper sx={{ p: 1, borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
      <Button
        color="primary"
        variant="contained"
        startIcon={buttonStartIcon}
        onClick={buttonOnClick}
        size="small"
        disabled={buttonDisabled}
        sx={buttonSx}
      >
        {buttonLabel}
      </Button>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0 }}>
      {tableProps.isContentTypeList ? (
        <EntityTable
          columns={tableProps.columns}
          rows={tableProps.rows}
          loading={tableProps.loading}
          onSelect={tableProps.onSelect}
          selectedId={tableProps.selectedId}
          onEdit={tableProps.onEdit}
          onDelete={tableProps.onDelete}
          density={tableProps.density}
          tableBorder={tableProps.tableBorder}
          showRowNumber={false}
        />
      ) : (
        <ContentList {...tableProps} />
      )}
    </Box>
    {children}
  </Paper>
);

interface DashboardProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, setMode }) => {
  // Content type state
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [showCreateType, setShowCreateType] = useState(false);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  // Content type creation state
  const [newTypeName, setNewTypeName] = useState('');
  const [newFields, setNewFields] = useState<ContentField[]>([{ name: '', type: 'text' }]);
  const [createTypeLoading, setCreateTypeLoading] = useState(false);
  const [createTypeError, setCreateTypeError] = useState<string | null>(null);

  // Content type edit state
  const [showEditType, setShowEditType] = useState(false);
  const [editTypeIndex, setEditTypeIndex] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editFields, setEditFields] = useState<ContentField[]>([]);
  const [editTypeLoading, setEditTypeLoading] = useState(false);
  const [editTypeError, setEditTypeError] = useState<string | null>(null);

  // Content type delete state
  const [showDeleteType, setShowDeleteType] = useState(false);
  const [deleteTypeIndex, setDeleteTypeIndex] = useState<number | null>(null);
  const [deleteTypeLoading, setDeleteTypeLoading] = useState(false);
  const [deleteTypeError, setDeleteTypeError] = useState<string | null>(null);

  // Content state
  const {
    contents,
    loading,
    error,
    selectedContent,
    fetchContents,
    createContent,
    updateContent,
    deleteContent,
    selectContent,
    clearError,
    fetchContentById,
  } = useContent();

  // Content creation dialog state
  const [showCreateContent, setShowCreateContent] = useState(false);

  // Server health state
  const [serverHealthy, setServerHealthy] = useState(true);

  // Add state for sidebar menu
  const [sidebarMenuAnchorEl, setSidebarMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarMenuRow, setSidebarMenuRow] = useState<any>(null);

  // Add state for enum options editing
  const [enumOptions, setEnumOptions] = useState<Record<number, string[]>>({});

  // Add state for edit enum options
  const [editEnumOptions, setEditEnumOptions] = useState<Record<number, string[]>>({});

  const { role: userRole, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch content types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      setTypeLoading(true);
      setTypeError(null);
      try {
        const types = await api.listContentTypes();
        setContentTypes(types);
        if (types.length > 0) {
          setSelectedTypeIndex(0);
          setSelectedContentType(types[0]);
        } else {
          setSelectedContentType(null);
        }
      } catch (err: any) {
        setTypeError(err.message || 'Failed to load content types');
      } finally {
        setTypeLoading(false);
      }
    };
    fetchTypes();
  }, []);

  // Update selected content type when index changes
  useEffect(() => {
    if (contentTypes.length > 0 && selectedTypeIndex < contentTypes.length) {
      setSelectedContentType(contentTypes[selectedTypeIndex]);
    } else {
      setSelectedContentType(null);
    }
  }, [contentTypes, selectedTypeIndex]);

  // Fetch contents when selected content type changes
  useEffect(() => {
    if (selectedContentType) {
      fetchContents(selectedContentType.id);
    }
  }, [selectedContentType, fetchContents]);

  // Filter contents by selected content type
  const filteredContents = selectedContentType
    ? contents.filter(c => c.content_type_id === selectedContentType.id)
    : contents;

  // Content type creation handlers
  const handleAddField = () => setNewFields([...newFields, { name: '', type: 'text' }]);
  const handleRemoveField = (idx: number) => setNewFields(newFields.filter((_, i) => i !== idx));
  const handleFieldChange = (idx: number, key: 'name' | 'type' | 'optional' | 'relation', value: string | boolean) => {
    setNewFields(fields => fields.map((f, i) => i === idx ? { ...f, [key]: value } : f));
    // Reset enum options if type changes
    if (key === 'type' && value === 'enum') {
      setEnumOptions(opts => ({ ...opts, [idx]: [''] }));
    }
  };
  const handleEnumOptionChange = (fieldIdx: number, optIdx: number, value: string) => {
    setEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: opts[fieldIdx].map((opt, i) => i === optIdx ? value : opt)
    }));
  };
  const handleAddEnumOption = (fieldIdx: number) => {
    setEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: [...(opts[fieldIdx] || []), '']
    }));
  };
  const handleRemoveEnumOption = (fieldIdx: number, optIdx: number) => {
    setEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: opts[fieldIdx].filter((_, i) => i !== optIdx)
    }));
  };
  const handleCreateType = async () => {
    if (!newTypeName.trim() || newFields.some(f => !f.name.trim())) {
      setCreateTypeError('Type name and all field names are required');
      return;
    }
    // Attach enum options to fields
    const fieldsWithOptions = newFields.map((f, idx) =>
      f.type === 'enum' ? { ...f, options: (enumOptions[idx] || []).filter(opt => opt.trim()) } : f
    );
    setCreateTypeLoading(true);
    setCreateTypeError(null);
    try {
      const payload = { name: newTypeName, fields: fieldsWithOptions };
      const created = await api.createContentType(payload);
      setContentTypes(types => [...types, created]);
      setSelectedTypeIndex(contentTypes.length); // select the new type
      setShowCreateType(false);
      setNewTypeName('');
      setNewFields([{ name: '', type: 'text' }]);
      setEnumOptions({});
    } catch (err: any) {
      setCreateTypeError(err.message || 'Failed to create content type');
    } finally {
      setCreateTypeLoading(false);
    }
  };

  // Content type edit handlers
  const openEditTypeDialog = (idx: number) => {
    setEditTypeIndex(idx);
    setEditTypeName(contentTypes[idx].name);
    setEditFields(contentTypes[idx].fields.map(f => ({ ...f })));
    // Initialize editEnumOptions for enum fields
    const initialEditEnumOptions: Record<number, string[]> = {};
    contentTypes[idx].fields.forEach((f, i) => {
      if (f.type === 'enum' && Array.isArray((f as any).options)) {
        initialEditEnumOptions[i] = [...((f as any).options as string[])];
      }
    });
    setEditEnumOptions(initialEditEnumOptions);
    setShowEditType(true);
    setEditTypeError(null);
  };
  const handleEditFieldChange = (idx: number, key: 'name' | 'type' | 'optional' | 'relation', value: string | boolean) => {
    setEditFields(fields => fields.map((f, i) => i === idx ? { ...f, [key]: value } : f));
    // Reset enum options if type changes
    if (key === 'type' && value === 'enum') {
      setEditEnumOptions(opts => ({ ...opts, [idx]: [''] }));
    }
  };
  const handleEditAddField = () => setEditFields([...editFields, { name: '', type: 'text' }]);
  const handleEditRemoveField = (idx: number) => setEditFields(editFields.filter((_, i) => i !== idx));
  const handleEditEnumOptionChange = (fieldIdx: number, optIdx: number, value: string) => {
    setEditEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: opts[fieldIdx].map((opt, i) => i === optIdx ? value : opt)
    }));
  };
  const handleEditAddEnumOption = (fieldIdx: number) => {
    setEditEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: [...(opts[fieldIdx] || []), '']
    }));
  };
  const handleEditRemoveEnumOption = (fieldIdx: number, optIdx: number) => {
    setEditEnumOptions(opts => ({
      ...opts,
      [fieldIdx]: opts[fieldIdx].filter((_, i) => i !== optIdx)
    }));
  };
  const handleEditType = async () => {
    if (editTypeIndex === null) return;
    if (!editTypeName.trim() || editFields.some(f => !f.name.trim())) {
      setEditTypeError('Type name and all field names are required');
      return;
    }
    // Attach enum options to fields
    const fieldsWithOptions = editFields.map((f, idx) =>
      f.type === 'enum' ? { ...f, options: (editEnumOptions[idx] || []).filter(opt => opt.trim()) } : f
    );
    setEditTypeLoading(true);
    setEditTypeError(null);
    try {
      const updated = await api.updateContentType(contentTypes[editTypeIndex].id, { name: editTypeName, fields: fieldsWithOptions });
      setContentTypes(types => types.map((t, i) => i === editTypeIndex ? updated : t));
      setShowEditType(false);
    } catch (err: any) {
      setEditTypeError(err.message || 'Failed to update content type');
    } finally {
      setEditTypeLoading(false);
    }
  };

  // Content type delete handlers
  const openDeleteTypeDialog = (idx: number) => {
    setDeleteTypeIndex(idx);
    setShowDeleteType(true);
    setDeleteTypeError(null);
  };
  const handleDeleteType = async () => {
    if (deleteTypeIndex === null) return;
    setDeleteTypeLoading(true);
    setDeleteTypeError(null);
    try {
      await api.deleteContentType(contentTypes[deleteTypeIndex].id);
      setContentTypes(types => types.filter((_, i) => i !== deleteTypeIndex));
      setShowDeleteType(false);
      if (selectedTypeIndex === deleteTypeIndex) {
        setSelectedTypeIndex(0);
      } else if (selectedTypeIndex > deleteTypeIndex) {
        setSelectedTypeIndex(selectedTypeIndex - 1);
      }
    } catch (err: any) {
      setDeleteTypeError(err.message || 'Failed to delete content type');
    } finally {
      setDeleteTypeLoading(false);
    }
  };

  // Refresh content types and content
  const handleRefresh = () => {
    window.location.reload(); // simplest way to refresh all
  };

  // Server health check
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await api.checkHealth();
      setServerHealthy(healthy);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Add handlers for main content edit/delete
  const handleEditContent = (content: ContentItem) => {
    selectContent(content);
    // Optionally open a modal for editing
  };
  const handleDeleteContent = async (content: ContentItem) => {
    try {
      await deleteContent(content.id);
      // Refresh the content list after successful deletion
      if (selectedContentType) {
        await fetchContents(selectedContentType.id);
      }
    } catch (error) {
      console.error('Delete content error:', error);
      alert('Failed to delete content: ' + ((error as any)?.message || 'Unknown error'));
    }
  };

  // Add logout handler
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Users', icon: <PeopleIcon />, path: '/users', admin: true },
    { label: 'Activity Log', icon: <ListAltIcon />, path: '/activity-log', admin: true },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Full-width Navbar at the top */}
      <AppBar position="static" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, mb: 1 }}>
        <Toolbar sx={{ gap: 2, minHeight: 64 }}>
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Minimal CMS Dashboard
          </Typography>
          <Chip
            icon={<RocketLaunchIcon />}
            label={serverHealthy ? 'Server Online' : 'Server Offline'}
            color={serverHealthy ? 'success' : 'error'}
            size="small"
            sx={{ mr: 1, fontWeight: 600 }}
          />
          <IconButton color="inherit" onClick={handleRefresh} disabled={loading} sx={{ mr: 1 }}>
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
          <Button color="inherit" startIcon={<PeopleIcon />} sx={{ ml: 1 }} onClick={() => navigate('/users')}>
            Users
          </Button>
          <Button color="inherit" onClick={() => navigate('/activity-log')} sx={{ ml: 1 }}>
            Activity Log
          </Button>
          <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {/* Main content with sidebar below navbar */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 64px)', gap: 2 }}>
          {/* Sidebar (content types) */}
          <Box
            sx={{
              width: { xs: '20%', sm: '15%', md: '12.5%', lg: '12.5%', xl: '12.5%' },
              flexShrink: 0,
              overflow: 'auto',
            }}
          >
            <DashboardPanel
              buttonLabel="New Type"
              buttonOnClick={() => setShowCreateType(true)}
              buttonStartIcon={<AddIcon />}
              buttonDisabled={false}
              buttonSx={{}}
              tableProps={{
                isContentTypeList: true,
                columns: [
                  {
                    field: 'name',
                    headerName: 'Name',
                    flex: 1,
                    minWidth: 120,
                    renderCell: (params: any) => params.value,
                    valueGetter: (params: any) => params.row.name,
                  },
                ],
                rows: contentTypes.map((type, idx) => ({
                  id: type.id,
                  name: type.name,
                  idx,
                  content_type_id: 'content-type',
                  data: { name: type.name },
                  created_at: '',
                  updated_at: '',
                })),
                loading: typeLoading,
                onSelect: (row: any) => setSelectedTypeIndex(contentTypes.findIndex(t => t.id === row.id)),
                selectedId: contentTypes[selectedTypeIndex]?.id,
                onEdit: (row: any) => openEditTypeDialog(contentTypes.findIndex(t => t.id === row.id)),
                onDelete: (row: any) => openDeleteTypeDialog(contentTypes.findIndex(t => t.id === row.id)),
                density: 'compact',
                tableBorder: true,
              }}
            />
          </Box>
          {/* Main content area */}
          <Box
            component="main"
            sx={{
              width: { xs: '80%', sm: '85%', md: '87.5%', lg: '87.5%', xl: '87.5%' },
              overflow: 'auto',
            }}
          >
            {/* Content Type Creation Dialog */}
            <Dialog open={showCreateType} onClose={() => setShowCreateType(false)} maxWidth="md" fullWidth>
              <DialogTitle>Create New Content Type</DialogTitle>
              <DialogContent>
                <TextField
                  label="Type Name"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Fields</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {newFields.map((field, idx) => (
                    <Paper key={idx} elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Field Name"
                        value={field.name}
                        onChange={e => handleFieldChange(idx, 'name', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ flex: 2, minWidth: 120, mb: { xs: 1, md: 0 } }}
                      />
                      <Select
                        value={field.type}
                        onChange={e => handleFieldChange(idx, 'type', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ flex: 2, ml: 1, minWidth: 120, mb: { xs: 1, md: 0 } }}
                        displayEmpty
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="relation">Relation</MenuItem>
                        <MenuItem value="media">Media</MenuItem>
                        <MenuItem value="enum">Enum</MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                      </Select>
                      {field.type === 'relation' && (
                        <Select
                          value={field.relation || ''}
                          onChange={e => handleFieldChange(idx, 'relation', e.target.value)}
                          size="small"
                          variant="outlined"
                          sx={{ flex: 2, ml: 1, minWidth: 120, mb: { xs: 1, md: 0 } }}
                          displayEmpty
                        >
                          <MenuItem value="">Select Type</MenuItem>
                          {contentTypes.map(ct => (
                            <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>
                          ))}
                        </Select>
                      )}
                      {field.type === 'enum' && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Enum Options</Typography>
                          {(enumOptions[idx] || ['']).map((opt, optIdx) => (
                            <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <TextField
                                value={opt}
                                onChange={e => handleEnumOptionChange(idx, optIdx, e.target.value)}
                                size="small"
                                placeholder={`Option ${optIdx + 1}`}
                                sx={{ mr: 1 }}
                              />
                              <IconButton onClick={() => handleRemoveEnumOption(idx, optIdx)} disabled={(enumOptions[idx] || []).length === 1} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                          <Button onClick={() => handleAddEnumOption(idx)} size="small" variant="outlined">Add Option</Button>
                        </Box>
                      )}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!field.optional}
                            onChange={e => handleFieldChange(idx, 'optional', e.target.checked)}
                            color="primary"
                            size="small"
                          />
                        }
                        label="Optional"
                        sx={{ ml: 1, mr: 1 }}
                      />
                      <IconButton onClick={() => handleRemoveField(idx)} disabled={newFields.length === 1} color="error" size="small" sx={{ ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
                <Button onClick={handleAddField} startIcon={<AddIcon />} variant="outlined" fullWidth sx={{ mt: 2, mb: 1 }}>
                  Add Field
                </Button>
                {createTypeError && <Alert severity="error" sx={{ mt: 2 }}>{createTypeError}</Alert>}
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                <Button onClick={() => setShowCreateType(false)} color="inherit">Cancel</Button>
                <Button onClick={handleCreateType} variant="contained" disabled={createTypeLoading} color="primary">
                  {createTypeLoading ? 'Creating...' : 'Create'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Edit Content Type Dialog */}
            <Dialog open={showEditType} onClose={() => setShowEditType(false)} maxWidth="md" fullWidth>
              <DialogTitle>Edit Content Type</DialogTitle>
              <DialogContent>
                {editTypeIndex !== null && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Content Type ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {contentTypes[editTypeIndex].id}
                    </Typography>
                  </Box>
                )}
                <TextField
                  label="Type Name"
                  value={editTypeName}
                  onChange={e => setEditTypeName(e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Fields</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {editFields.map((field, idx) => (
                    <Paper key={idx} elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Field Name"
                        value={field.name}
                        onChange={e => handleEditFieldChange(idx, 'name', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ flex: 2, minWidth: 120, mb: { xs: 1, md: 0 } }}
                      />
                      <Select
                        value={field.type}
                        onChange={e => handleEditFieldChange(idx, 'type', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ flex: 2, ml: 1, minWidth: 120, mb: { xs: 1, md: 0 } }}
                        displayEmpty
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="relation">Relation</MenuItem>
                        <MenuItem value="media">Media</MenuItem>
                        <MenuItem value="enum">Enum</MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                      </Select>
                      {field.type === 'relation' && (
                        <Select
                          value={field.relation || ''}
                          onChange={e => handleEditFieldChange(idx, 'relation', e.target.value)}
                          size="small"
                          variant="outlined"
                          sx={{ flex: 2, ml: 1, minWidth: 120, mb: { xs: 1, md: 0 } }}
                          displayEmpty
                        >
                          <MenuItem value="">Select Type</MenuItem>
                          {contentTypes.map(ct => (
                            <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>
                          ))}
                        </Select>
                      )}
                      {field.type === 'enum' && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Enum Options</Typography>
                          {(editEnumOptions[idx] || ['']).map((opt, optIdx) => (
                            <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <TextField
                                value={opt}
                                onChange={e => handleEditEnumOptionChange(idx, optIdx, e.target.value)}
                                size="small"
                                placeholder={`Option ${optIdx + 1}`}
                                sx={{ mr: 1 }}
                              />
                              <IconButton onClick={() => handleEditRemoveEnumOption(idx, optIdx)} disabled={(editEnumOptions[idx] || []).length === 1} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                          <Button onClick={() => handleEditAddEnumOption(idx)} size="small" variant="outlined">Add Option</Button>
                        </Box>
                      )}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!field.optional}
                            onChange={e => handleEditFieldChange(idx, 'optional', e.target.checked)}
                            color="primary"
                            size="small"
                          />
                        }
                        label="Optional"
                        sx={{ ml: 1, mr: 1 }}
                      />
                      <IconButton onClick={() => handleEditRemoveField(idx)} disabled={editFields.length === 1} color="error" size="small" sx={{ ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
                <Button onClick={handleEditAddField} startIcon={<AddIcon />} variant="outlined" fullWidth sx={{ mt: 2, mb: 1 }}>
                  Add Field
                </Button>
                {editTypeError && <Alert severity="error" sx={{ mt: 2 }}>{editTypeError}</Alert>}
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                <Button onClick={() => setShowEditType(false)} color="inherit">Cancel</Button>
                <Button onClick={handleEditType} variant="contained" disabled={editTypeLoading} color="primary">
                  {editTypeLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Delete Content Type Dialog */}
            <Dialog open={showDeleteType} onClose={() => setShowDeleteType(false)} maxWidth="xs">
              <DialogTitle>Delete Content Type</DialogTitle>
              <DialogContent>
                <Typography>Are you sure you want to delete this content type? This action cannot be undone.</Typography>
                {deleteTypeError && <Alert severity="error" sx={{ mt: 2 }}>{deleteTypeError}</Alert>}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowDeleteType(false)}>Cancel</Button>
                <Button onClick={handleDeleteType} color="error" variant="contained" disabled={deleteTypeLoading}>
                  {deleteTypeLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogActions>
            </Dialog>

            <Container maxWidth={false} disableGutters sx={{ mb: 0, p: 0 }}>
              <DashboardPanel
                buttonLabel={`New ${selectedContentType ? selectedContentType.name : 'Content'}`}
                buttonOnClick={() => setShowCreateContent(true)}
                buttonStartIcon={<AddIcon />}
                buttonDisabled={!selectedContentType}
                buttonSx={{}}
                tableProps={{
                  contents: filteredContents,
                  loading,
                  onSelect: selectContent,
                  selectedId: selectedContent?.id,
                  contentType: selectedContentType,
                  onEdit: handleEditContent,
                  onDelete: handleDeleteContent,
                  density: 'compact',
                  tableBorder: true,
                  fetchContents: fetchContents,
                }}
              >
                {error && contents.length === 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        {error.includes('Network') || error.includes('Failed to fetch')
                          ? 'Unable to communicate with the server. Please check your connection or try again later.'
                          : error}
                      </span>
                      <Button onClick={handleRefresh} color="inherit" variant="outlined" sx={{ ml: 2 }}>
                        Retry
                      </Button>
                    </Box>
                  </Alert>
                )}
              </DashboardPanel>
              {showCreateContent && selectedContentType && (
                <ContentForm
                  open={showCreateContent}
                  onClose={() => setShowCreateContent(false)}
                  onSubmit={createContent}
                  onSuccess={() => {
                    setShowCreateContent(false);
                  }}
                  contentType={selectedContentType}
                />
              )}
              {selectedContent && selectedContentType && (
                <ContentDetail
                  content={selectedContent}
                  onUpdate={updateContent}
                  onDelete={deleteContent}
                  onClose={() => selectContent(null)}
                  onUpdateSuccess={async () => {
                    if (selectedContent) {
                      await fetchContentById(selectedContent.id);
                    }
                  }}
                  onDeleteSuccess={async () => {
                    // Refresh the content list after successful deletion
                    if (selectedContentType) {
                      await fetchContents(selectedContentType.id);
                    }
                  }}
                  contentType={selectedContentType}
                />
              )}
            </Container>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

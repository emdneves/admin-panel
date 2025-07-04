import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Grid,
  Chip,
  Divider,
  Alert,
  Paper,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ContentItem, UpdateContentInput, ContentType } from '../../types';
import { format } from 'date-fns';
import { uploadAndProcessImage } from '../../utils/uploadAndProcessImage';

console.log('ContentDetail module loaded');

interface ContentDetailProps {
  content: ContentItem;
  onUpdate: (input: UpdateContentInput) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onClose: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
  contentType: ContentType;
}

const BACKEND_URL = 'http://localhost:3000';

// Helper to add cache-busting param
const cacheBust = () => `?t=${Date.now()}`;

// Helper to add cache-busting param based on image URL
const getCacheBust = (url: string) => url ? `?t=${encodeURIComponent(url)}` : '';

const getUserDisplay = (user: any) => {
  if (!user) return 'Unknown';
  if (typeof user === 'string') return user;
  if (user.email && user.role) return `${user.email} (${user.role})`;
  if (user.email) return user.email;
  return 'Unknown';
};

const ContentDetail: React.FC<ContentDetailProps> = ({
  content,
  onUpdate,
  onDelete,
  onClose,
  onUpdateSuccess,
  onDeleteSuccess,
  contentType,
}) => {
  console.log('ContentDetail render:', content);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    setEditedData(content.data);
    setIsEditing(false);
    console.log('created_by:', content.created_by, 'updated_by:', content.updated_by);
  }, [content]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setEditedData(content.data);
    setIsEditing(false);
  };
  const handleFieldChange = (key: string, value: any) => {
    setEditedData({ ...editedData, [key]: value });
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      const processedData: Record<string, any> = {};
      contentType.fields.forEach(field => {
        if (field.type === 'number') {
          processedData[field.name] = Number(editedData[field.name]);
        } else if (field.type === 'date' && editedData[field.name]) {
          processedData[field.name] = editedData[field.name] instanceof Date
            ? editedData[field.name].toISOString()
            : editedData[field.name];
        } else {
          processedData[field.name] = editedData[field.name];
        }
      });
      if (!content.id || !processedData || Object.keys(processedData).length === 0) {
        throw new Error('Missing content id or no data to update.');
      }
      console.log('Updating content with:', { id: content.id, data: processedData });
      const updated = await onUpdate({ id: content.id, data: processedData });
      setIsEditing(false);
      setEditedData(updated.data);
      onClose();
    } catch (error) {
      console.error('Update content error:', error);
      alert('Failed to update content: ' + ((error as any)?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(content.id);
      onDeleteSuccess();
      onClose();
    } catch (error) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight={700}>{contentType.name} Details</Typography>
            <Chip label={contentType.name} size="small" color="primary" />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {/* Metadata Section */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {content.id}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Created
              </Typography>
              <Typography variant="body2">
                {format(new Date(content.created_at), 'dd/MM/yyyy HH:mm')}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Created By
              </Typography>
              <Typography variant="body2">
                {content.created_by && typeof content.created_by === 'string'
                  ? content.created_by
                  : content.created_by && typeof content.created_by === 'object' && content.created_by.email
                    ? content.created_by.email
                    : 'Unknown'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Updated
              </Typography>
              <Typography variant="body2">
                {format(new Date(content.updated_at), 'dd/MM/yyyy HH:mm')}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Updated By
              </Typography>
              <Typography variant="body2">
                {content.updated_by && typeof content.updated_by === 'string'
                  ? content.updated_by
                  : content.updated_by && typeof content.updated_by === 'object' && content.updated_by.email
                    ? content.updated_by.email
                    : 'Unknown'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        {/* Data Fields Section */}
        <Stack
          spacing={2}
          onKeyDown={e => {
            if (isEditing && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
        >
          {contentType.fields.map(field => (
            <Paper
              key={field.name}
              elevation={1}
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
              onDoubleClick={() => setIsEditing(true)}
              style={{ cursor: !isEditing ? 'pointer' : undefined }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}>
                  {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {field.optional && <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>}
                </Typography>
                {!isEditing ? (
                  field.type === 'media' && content.data[field.name] ? (
                    <Box
                      sx={{
                        width: 500,
                        height: 500,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 2,
                      }}
                    >
                      {typeof content.data[field.name] === 'string' ? (
                        (() => {
                          const value = content.data[field.name] as string;
                          return (
                            <img
                              src={value.startsWith('/uploads/')
                                ? `${BACKEND_URL}${value}${getCacheBust(value)}`
                                : `${value}${getCacheBust(value)}`}
                              alt="preview"
                              style={{
                                maxWidth: 500,
                                maxHeight: 500,
                                objectFit: 'contain',
                                background: '#fff',
                              }}
                            />
                          );
                        })()
                      ) : null}
                    </Box>
                  ) : field.type === 'date' && content.data[field.name] ? (
                    <Typography variant="body1" sx={{ fontWeight: 400 }}>
                      {format(new Date(content.data[field.name]), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  ) : (
                    <Typography variant="body1" sx={{ fontWeight: 400 }}>
                      {content.data[field.name]?.toString() || <span style={{ color: '#aaa' }}>—</span>}
                    </Typography>
                  )
                ) : field.type === 'media' ? (
                  <Box>
                    {typeof editedData[field.name] === 'string' && editedData[field.name] && (
                      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                          src={
                            editedData[field.name].startsWith('/uploads/')
                              ? `${BACKEND_URL}${editedData[field.name]}${getCacheBust(editedData[field.name])}`
                              : `${editedData[field.name]}${getCacheBust(editedData[field.name])}`
                          }
                          alt="preview"
                          style={{ maxWidth: 180, maxHeight: 180, objectFit: 'contain', background: '#fff', borderRadius: 2 }}
                        />
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                        >
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={async e => {
                              if (e.target.files && e.target.files[0]) {
                                // Try to get the content name from the first text field
                                const nameField = contentType.fields.find(f => f.type === 'text');
                                const contentName = nameField ? (editedData[nameField.name] || '') : '';
                                const result = await uploadAndProcessImage(
                                  e.target.files[0],
                                  field.name,
                                  contentType.id,
                                  contentType.name,
                                  String(contentName)
                                );
                                setEditedData(prev => ({ ...prev, [field.name]: result.url }));
                              }
                            }}
                          />
                        </Button>
                      </Box>
                    )}
                    {(!editedData[field.name] || typeof editedData[field.name] !== 'string') && (
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                      >
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={async e => {
                            if (e.target.files && e.target.files[0]) {
                              const nameField = contentType.fields.find(f => f.type === 'text');
                              const contentName = nameField ? (editedData[nameField.name] || '') : '';
                              const result = await uploadAndProcessImage(
                                e.target.files[0],
                                field.name,
                                contentType.id,
                                contentType.name,
                                String(contentName)
                              );
                              setEditedData(prev => ({ ...prev, [field.name]: result.url }));
                            }
                          }}
                        />
                      </Button>
                    )}
                  </Box>
                ) : field.type === 'number' ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={editedData[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    size="small"
                  />
                ) : field.type === 'date' ? (
                  <DatePicker
                    value={editedData[field.name] ? new Date(editedData[field.name]) : null}
                    onChange={date => handleFieldChange(field.name, date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={editedData[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    size="small"
                  />
                )}
              </Box>
              {field.optional && <Chip label="Optional" size="small" sx={{ ml: 2 }} />}
            </Paper>
          ))}
        </Stack>
        {deleteConfirm && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            Are you sure you want to delete this content? This action cannot be undone.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
        {!isEditing && !deleteConfirm && (
          <>
            <Button startIcon={<EditIcon />} onClick={handleEdit} variant="outlined" color="primary">
              Edit
            </Button>
            <Button startIcon={<DeleteIcon />} onClick={() => setDeleteConfirm(true)} color="error" variant="outlined">
              Delete
            </Button>
          </>
        )}
        {isEditing && (
          <>
            <Button startIcon={<CancelIcon />} onClick={handleCancel} disabled={loading} color="inherit">
              Cancel
            </Button>
            <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" disabled={loading} color="primary">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </>
        )}
        {deleteConfirm && (
          <>
            <Button onClick={() => setDeleteConfirm(false)} disabled={loading} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContentDetail;

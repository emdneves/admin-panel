import React, { useState, useRef, useEffect } from 'react';
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
  FormHelperText,
  Card,
  CardContent,
  Paper,
  Divider,
  Stack,
  Chip,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CreateContentInput, ContentType } from '../../types';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { uploadAndProcessImage } from '../../utils/uploadAndProcessImage';
import api from '../../services/api';

interface ContentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateContentInput) => Promise<any>;
  onSuccess: () => void;
  contentType: ContentType;
}

const ContentForm: React.FC<ContentFormProps> = ({
  open,
  onClose,
  onSubmit,
  onSuccess,
  contentType,
}) => {
  const [fields, setFields] = useState<Record<string, string | number | Date | null>>(
    () => Object.fromEntries(contentType.fields.map(f => [f.name, f.type === 'date' ? null : '']))
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [mediaPreviews, setMediaPreviews] = useState<{ [key: string]: string }>({});
  const [mediaFiles, setMediaFiles] = useState<{ [key: string]: File | null }>({});
  const [mediaSizeErrors, setMediaSizeErrors] = useState<{ [key: string]: string }>({});
  const [mediaInfo, setMediaInfo] = useState<{ [key: string]: { name: string; size: number; type: string } | null }>({});
  const [relationOptions, setRelationOptions] = useState<Record<string, { id: string; label: string }[]>>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    // Fetch relation options for all relation fields
    const fetchRelations = async () => {
      const relFields = contentType.fields.filter(f => f.type === 'relation' && f.relation);
      const newOptions: Record<string, { id: string; label: string }[]> = {};
      for (const field of relFields) {
        try {
          const items = await api.listContent(field.relation);
          // Fetch the referenced content type to know which field to use as label
          let labelKeys = ['name', 'title', 'label', 'id'];
          try {
            const refType = await api.getContentType(field.relation!);
            // Prioritize fields that exist in the referenced content type
            labelKeys = ['name', 'title', 'label', 'id'].filter(key => refType.fields.some((f: any) => f.name === key)).concat('id');
          } catch {}
          newOptions[field.name] = items.map(item => {
            let label = item.id;
            for (const key of labelKeys) {
              if (item.data[key]) {
                label = String(item.data[key]);
                break;
              }
            }
            return { id: item.id, label };
          });
        } catch {
          newOptions[field.name] = [];
        }
      }
      setRelationOptions(newOptions);
    };
    fetchRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    contentType.fields.forEach(field => {
      if (!field.optional && (fields[field.name] === '' || fields[field.name] === null)) {
        newErrors[field.name] = 'Field value is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFields(prev => ({ ...prev, [name]: value }));
  };

  // Handle media select for preview and base64 encoding
  const handleMediaSelect = async (name: string, file: File) => {
    try {
      // Try to get the content name from the first text field
      const nameField = contentType.fields.find(f => f.type === 'text');
      const contentName = nameField ? (fields[nameField.name] || '') : '';
      const result = await uploadAndProcessImage(file, name, contentType.id, contentType.name, String(contentName));
      setMediaPreviews(prev => ({ ...prev, [name]: result.url }));
      setFields(prev => ({ ...prev, [name]: result.url }));
      setMediaSizeErrors(prev => ({ ...prev, [name]: '' }));
      setMediaInfo(prev => ({ ...prev, [name]: { name: file.name, size: result.size, type: result.type } }));
    } catch (err: any) {
      setMediaSizeErrors(prev => ({ ...prev, [name]: err.message || 'Failed to upload image.' }));
      setMediaPreviews(prev => ({ ...prev, [name]: '' }));
      setFields(prev => ({ ...prev, [name]: '' }));
      setMediaInfo(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRemoveMedia = (name: string) => {
    setMediaPreviews(prev => ({ ...prev, [name]: '' }));
    setFields(prev => ({ ...prev, [name]: '' }));
    setMediaInfo(prev => ({ ...prev, [name]: null }));
    setMediaSizeErrors(prev => ({ ...prev, [name]: '' }));
    if (fileInputRefs.current[name]) fileInputRefs.current[name]!.value = '';
  };

  const handleSubmit = async () => {
    // Prevent submit if any media field has a size error
    if (Object.values(mediaSizeErrors).some(msg => msg)) return;
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data: Record<string, number | string | Date | null> = {};
      for (const field of contentType.fields) {
        if (field.type === 'number') {
          data[field.name] = Number(fields[field.name]);
        } else if (field.type === 'date' && fields[field.name]) {
          data[field.name] = fields[field.name] as Date;
        } else {
          data[field.name] = fields[field.name] as string;
        }
      }
      // Remove nulls from data before submit
      Object.keys(data).forEach(key => {
        if (data[key] === null) {
          delete data[key];
        }
      });
      await onSubmit({ content_type_id: contentType.id, data: data as Record<string, string | number | Date> });
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Create content error:', error);
      if (error?.message === 'Network Error') {
        alert('Failed to create content: Network Error.\nPossible causes:\n- The image is too large (max 2MB).\n- The backend server is not running or not reachable.\n- There is a network or CORS issue.');
      } else {
        alert('Failed to create content: ' + (error?.message || (error?.response && error.response.data && error.response.data.error) || 'Unknown error'));
      }
      // Do NOT close the modal here
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFields(Object.fromEntries(contentType.fields.map(f => [f.name, f.type === 'date' ? null : ''])));
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={700}>Create New {contentType.name}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Content Type ID
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {contentType.id}
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {contentType.fields.map((field, idx) => (
            <Paper key={field.name} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}>
                  {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {field.optional && <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>}
                </Typography>
                {field.type === 'relation' ? (
                  <Select
                    fullWidth
                    value={fields[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    error={!!errors[field.name]}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value=""><em>Select...</em></MenuItem>
                    {(relationOptions[field.name] || []).map(option => (
                      <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                    ))}
                  </Select>
                ) : field.type === 'enum' ? (
                  <Select
                    fullWidth
                    value={fields[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    error={!!errors[field.name]}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value=""><em>Select...</em></MenuItem>
                    {(field.options || []).map((opt: string) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                ) : field.type === 'price' ? (
                  <TextField
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01' }}
                    value={fields[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]}
                    size="small"
                    placeholder="Enter price"
                  />
                ) : field.type === 'number' ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={fields[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]}
                    size="small"
                    placeholder="Enter number"
                  />
                ) : field.type === 'date' ? (
                  <DatePicker
                    value={fields[field.name] as Date | null}
                    onChange={date => handleFieldChange(field.name, date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors[field.name],
                        helperText: errors[field.name],
                        size: 'small',
                      },
                    }}
                  />
                ) : field.type === 'media' ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={el => (fileInputRefs.current[field.name] = el)}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleMediaSelect(field.name, e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        id={`media-upload-${field.name}`}
                      />
                      <Button
                        variant="outlined"
                        component="span"
                        onClick={() => fileInputRefs.current[field.name]?.click()}
                        size="small"
                      >
                        {mediaInfo[field.name] ? 'Change Image' : 'Upload Image'}
                      </Button>
                      {mediaInfo[field.name] && !mediaSizeErrors[field.name] && (
                        <Typography variant="caption">
                          <b>{mediaInfo[field.name]?.name || ''}</b> ({mediaInfo[field.name]?.size ? (mediaInfo[field.name]!.size / 1024).toFixed(1) : '0'} KB, {mediaInfo[field.name]?.type || ''})
                        </Typography>
                      )}
                      {mediaInfo[field.name] && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveMedia(field.name)}
                          sx={{ ml: 1 }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                    {mediaSizeErrors[field.name] && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {mediaSizeErrors[field.name]}
                      </Typography>
                    )}
                    {mediaPreviews[field.name] && (
                      <Box
                        sx={{
                          width: 200,
                          height: 200,
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mt: 1,
                          mb: 1,
                          borderRadius: 2,
                          boxShadow: 1,
                        }}
                      >
                        <img
                          src={mediaPreviews[field.name]}
                          alt="preview"
                          style={{
                            maxWidth: 180,
                            maxHeight: 180,
                            objectFit: 'contain',
                            background: '#fff',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={fields[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]}
                    size="small"
                    placeholder="Enter text"
                  />
                )}
              </Box>
              {field.optional && <Chip label="Optional" size="small" sx={{ ml: 2 }} />}
            </Paper>
          ))}
        </Stack>
        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || Object.values(mediaSizeErrors).some(msg => msg)} color="primary">
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentForm;

import React, { useState } from 'react';
import { GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import { ContentItem, ContentType } from '../../types';
import { format } from 'date-fns';
import EntityTable from '../Table/EntityTable';
import { Tooltip } from '@mui/material';

interface ContentListProps {
  contents: ContentItem[];
  loading: boolean;
  onSelect: (content: ContentItem) => void;
  selectedId?: string;
  contentType: ContentType;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (content: ContentItem) => void;
  density?: 'compact' | 'standard' | 'comfortable';
  tableBorder?: boolean;
}

const ContentList: React.FC<ContentListProps> = ({
  contents,
  loading,
  onSelect,
  selectedId,
  contentType,
  onEdit,
  onDelete,
  density = 'standard',
  tableBorder = false,
}) => {
  if (!contentType) return null;

  // State to track image heights per row/field
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});

  // Dynamically generate columns based on contentType.fields
  const columns: GridColDef[] = [
    ...contentType.fields.map(field => {
      let flex = 1;
      if (field.name === 'name' || field.name === 'publisher' || field.name === 'author') {
        flex = 2;
      }
      if (field.name === 'edition' || field.name === 'isbn') {
        flex = 0.7;
      }
      return {
        field: field.name,
        headerName: field.name.charAt(0).toUpperCase() + field.name.slice(1),
        flex,
        valueGetter: (params: GridValueGetterParams) => params.row.data[field.name],
        renderCell: (params: GridRenderCellParams) => {
          const value = params.value;
          if (field.type === 'media' && typeof value === 'string' && value) {
            const isRelative = value.startsWith('/uploads/');
            const cacheBust = `?t=${Date.now()}`;
            const src = isRelative ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${value}${cacheBust}` : `${value}${cacheBust}`;
            const rowKey = `${params.id}-${field.name}`;
            return (
              <img
                src={src}
                alt={field.name}
                style={{
                  width: 'auto',
                  height: imageHeights[rowKey] ? Math.min(imageHeights[rowKey], 120) : 80,
                  maxHeight: 120,
                  objectFit: 'contain',
                  borderRadius: 6,
                  background: '#eee',
                  display: 'block',
                  margin: '0 auto',
                }}
                onLoad={e => {
                  const h = (e.target as HTMLImageElement).naturalHeight;
                  if (h && imageHeights[rowKey] !== h) {
                    setImageHeights(prev => ({ ...prev, [rowKey]: h }));
                  }
                }}
              />
            );
          }
          if (field.type === 'date' && value) {
            return (
              <Tooltip title={format(new Date(value), 'dd/MM/yyyy HH:mm')}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>
                  {format(new Date(value), 'dd/MM/yyyy HH:mm')}
                </span>
              </Tooltip>
            );
          }
          return (
            <Tooltip title={value?.toString() || ''}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>
                {value?.toString() || ''}
              </span>
            </Tooltip>
          );
        }
      };
    }),
    {
      field: 'user',
      headerName: 'User',
      flex: 1.2,
      valueGetter: (params: GridValueGetterParams) => params.row.updated_by || params.row.created_by,
      renderCell: (params: GridRenderCellParams) => {
        const user = params.row.updated_by || params.row.created_by;
        if (!user) return 'Unknown';
        if (typeof user === 'string') return user;
        if (user.email && user.role) return `${user.email} (${user.role})`;
        if (user.email) return user.email;
        return 'Unknown';
      }
    }
  ];

  // Flexible row height based on image height
  const getRowHeight = (params: any) => {
    // Find all media fields for this row
    const mediaFields = contentType.fields.filter(f => f.type === 'media');
    let maxHeight = 32;
    for (const field of mediaFields) {
      const rowKey = `${params.id}-${field.name}`;
      if (imageHeights[rowKey]) {
        maxHeight = Math.max(maxHeight, Math.min(imageHeights[rowKey], 120));
      }
    }
    return maxHeight;
  };

  return (
    <EntityTable
      columns={columns}
      rows={contents}
      loading={loading}
      onSelect={onSelect}
      selectedId={selectedId}
      onEdit={onEdit}
      onDelete={onDelete}
      density={density}
      tableBorder={tableBorder}
      showRowNumber={true}
      getRowHeight={getRowHeight}
    />
  );
};

export default ContentList;

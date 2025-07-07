import React, { useState, useEffect } from 'react';
import { GridColDef, GridRenderCellParams, GridValueGetterParams, GridRowModel } from '@mui/x-data-grid';
import { ContentItem, ContentType } from '../../types';
import { format } from 'date-fns';
import EntityTable from '../Table/EntityTable';
import { Tooltip, Select, MenuItem } from '@mui/material';
import api from '../../services/api';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';

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
  fetchContents: (contentTypeId: string) => Promise<void>;
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
  fetchContents,
}) => {
  if (!contentType) return null;

  // State to track image heights per row/field
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  // State to map relation field name to id->label map
  const [relationMaps, setRelationMaps] = useState<Record<string, Record<string, string>>>({});
  const [updatingRow, setUpdatingRow] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    // Fetch all related content items for each relation field
    const fetchRelations = async () => {
      const relFields = contentType.fields.filter(f => f.type === 'relation' && f.relation);
      const newMaps: Record<string, Record<string, string>> = {};
      for (const field of relFields) {
        try {
          const items = await api.listContent(field.relation);
          let labelKeys = ['name', 'title', 'label', 'id'];
          try {
            const refType = await api.getContentType(field.relation!);
            labelKeys = ['name', 'title', 'label', 'id'].filter(key => refType.fields.some((f: any) => f.name === key)).concat('id');
          } catch {}
          const idToLabel: Record<string, string> = {};
          for (const item of items) {
            let label = item.id;
            for (const key of labelKeys) {
              if (item.data[key]) {
                label = String(item.data[key]);
                break;
              }
            }
            idToLabel[item.id] = label;
          }
          newMaps[field.name] = idToLabel;
        } catch {
          newMaps[field.name] = {};
        }
      }
      setRelationMaps(newMaps);
    };
    fetchRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  // Prepare flat rows for DataGrid: { id, ...data, ...otherMeta }
  const flatRows = contents.map(item => ({
    id: item.id,
    ...item.data,
    updated_by: item.updated_by,
    created_by: item.created_by,
    // add any other meta fields you want to show
  }));

  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    setUpdatingRow(true);
    try {
      // Reconstruct data object from flat row
      const data: Record<string, any> = {};
      contentType.fields.forEach(field => {
        let value = typeof newRow[field.name] !== 'undefined' ? newRow[field.name] : oldRow[field.name];
        if (field.type === 'number' || field.type === 'price') {
          value = Number(value);
        }
        if (field.type === 'boolean') {
          value = value === 'true' || value === true;
        }
        if (field.type === 'enum') {
          if (typeof value !== 'string' || !(field.options || []).includes(value)) {
            value = (field.options && field.options[0]) || '';
          }
        }
        data[field.name] = value;
      });
      await api.updateContent({ id: newRow.id, data });
      if (fetchContents) await fetchContents(contentType.id);
      setUpdatingRow(false);
      return { ...newRow };
    } catch (e) {
      setUpdatingRow(false);
      return oldRow;
    }
  };

  // Use built-in DataGrid singleSelect editor for enum fields for robustness
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>
            {params.value}
          </span>
        </Tooltip>
      ),
      editable: false,
    },
    ...contentType.fields
      .filter(field => field.type !== 'media' && field.name.toLowerCase() !== 'cover')
      .map(field => {
        let flex = 1;
        if (field.name === 'name' || field.name === 'publisher' || field.name === 'author') {
          flex = 2;
        }
        if (field.name === 'edition' || field.name === 'isbn') {
          flex = 0.7;
        }
        let col: GridColDef = {
          field: field.name,
          headerName: field.name.charAt(0).toUpperCase() + field.name.slice(1),
          flex,
          editable: true,
          renderCell: (params: GridRenderCellParams) => {
            const value = params.value;
            let cellContent = null;
            if (field.type === 'relation') {
              const relMap = relationMaps[field.name] || {};
              cellContent = relMap[value] || value || '';
            } else if (field.type === 'media' && typeof value === 'string' && value) {
              return null;
            } else if (field.type === 'date' && value) {
              cellContent = format(new Date(value), 'dd/MM/yyyy HH:mm');
            } else if (field.type === 'boolean') {
              cellContent = value === 'true' ? 'True' : value === 'false' ? 'False' : '';
            } else {
              cellContent = value?.toString() || '';
            }
            // Always show as input-like box for editable cells
            const showDropdown = field.type === 'enum' || field.type === 'boolean';
            return (
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  background: theme.palette.mode === 'dark' ? '#181818' : '#fafbfc',
                  border: params.hasFocus ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
                  borderRadius: 12,
                  padding: '2px 8px',
                  minHeight: 24,
                  fontSize: 13,
                  color: theme.palette.mode === 'dark' ? '#fff' : '#181818',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {cellContent}
                {showDropdown && (
                  <ArrowDropDownIcon style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#bdbdbd', pointerEvents: 'none' }} fontSize="small" />
                )}
              </span>
            );
          },
        };
        if (field.type === 'enum') {
          col = {
            ...col,
            type: 'singleSelect',
            valueOptions: field.options || [],
          };
        }
        if (field.type === 'price') {
          col = {
            ...col,
            type: 'number',
          };
        }
        if (field.type === 'boolean') {
          col = {
            ...col,
            type: 'singleSelect',
            valueOptions: ['true', 'false'],
          };
        }
        return col;
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
      rows={flatRows}
      loading={loading || updatingRow}
      onSelect={onEdit ? undefined : onSelect}
      selectedId={selectedId}
      onEdit={onEdit ? (row => {
        const original = contents.find(item => item.id === row.id);
        if (original) onEdit(original);
      }) : undefined}
      onDelete={onDelete}
      density={density}
      tableBorder={tableBorder}
      showRowNumber={true}
      getRowHeight={getRowHeight}
      // Enable inline editing
      processRowUpdate={processRowUpdate}
      experimentalFeatures={{ newEditingApi: true }}
    />
  );
};

export default ContentList;

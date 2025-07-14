import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  useGridApiRef,
  GridApiContext,
} from '@mui/x-data-grid';
import { Box, CircularProgress, Tooltip, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useGridApiContext, useGridSelector } from '@mui/x-data-grid';
import { Pagination, Typography } from '@mui/material';

export interface EntityTableProps {
  columns: GridColDef[];
  rows: any[];
  loading: boolean;
  onSelect?: (row: any) => void;
  selectedId?: string;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  density?: 'compact' | 'standard' | 'comfortable';
  tableBorder?: boolean;
  showRowNumber?: boolean;
  getRowHeight?: (params: any) => number;
  processRowUpdate?: (newRow: any, oldRow: any) => Promise<any>;
  experimentalFeatures?: any;
  sx?: object;
}

// Custom Pagination component for DataGrid
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  if (pageCount <= 1) return null;
  return (
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pr: 2 }}>
      <Pagination
        count={pageCount}
        page={page + 1}
        onChange={(_, value) => apiRef.current.setPage(value - 1)}
        size="small"
        color="primary"
        siblingCount={0}
        boundaryCount={1}
        showFirstButton
        showLastButton
      />
    </Box>
  );
}

const EntityTable: React.FC<EntityTableProps> = ({
  columns,
  rows,
  loading,
  onSelect,
  selectedId,
  onEdit,
  onDelete,
  density = 'standard',
  tableBorder = false,
  showRowNumber = false,
  getRowHeight,
  processRowUpdate,
  experimentalFeatures,
  sx,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = React.useState<any>(null);

  // Get page and pageSize for row numbering
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [sortModel, setSortModel] = React.useState([
    { field: 'name', sort: 'asc' as const },
  ]);

  // Add actions column if needed
  const finalColumns = React.useMemo(() => {
    let cols = columns;
    if (showRowNumber) {
      const rowNumberCol: GridColDef = {
        field: '__rowNumber',
        headerName: '#',
        width: 56,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => {
          // Simple row numbering based on params.api.getRowIndexRelativeToVisibleRows
          const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
          return <span>{rowIndex + 1}</span>;
        },
      };
      cols = [rowNumberCol, ...cols];
    }
    if (onEdit || onDelete) {
      cols = [
        ...cols,
        {
          field: 'actions',
          headerName: '',
          width: 60,
          sortable: false,
          filterable: false,
          renderCell: (params: GridRenderCellParams) => (
            <IconButton
              edge="end"
              size="small"
              onClick={e => {
                e.stopPropagation();
                setMenuAnchorEl(e.currentTarget);
                setMenuRow(params.row);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          ),
        },
      ];
    }
    return cols;
  }, [columns, onEdit, onDelete, showRowNumber]);

  // DataGrid will call this when page or pageSize changes
  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setPage(model.page);
    setPageSize(model.pageSize);
  };

  const handleSortModelChange = (model: any) => {
    setSortModel(model);
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DataGrid
            rows={rows || []}
            columns={finalColumns}
            getRowId={row => row.id}
            rowSelectionModel={selectedId ? [selectedId] : []}
            density={density}
            sx={{
              ...sx,
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
            }}
            getRowHeight={getRowHeight}
            localeText={{
              MuiTablePagination: {
                labelRowsPerPage: '',
              },
              noRowsLabel: 'No rows',
              footerRowSelected: () => '',
            }}
            pagination
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={handlePaginationModelChange}
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            pageSizeOptions={[50, 100, 500]}
            processRowUpdate={processRowUpdate}
            experimentalFeatures={experimentalFeatures}
            onRowClick={onSelect ? params => onSelect(params.row) : undefined}
            editMode="cell"
            disableColumnMenu
            isCellEditable={(params) => params.field !== 'actions'}
          />
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {onEdit && (
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  if (onEdit && menuRow) onEdit(menuRow);
                }}
              >Edit</MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  if (onDelete && menuRow) onDelete(menuRow);
                }}
                sx={{ color: 'error.main' }}
              >Delete</MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default EntityTable; 
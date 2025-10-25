import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  Button,
  ButtonGroup,
  CircularProgress,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Fade,
  Zoom,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  ContentCopy as CopyIcon,
  TableChart as TableIcon,
  TextSnippet as DocumentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableHeaderCell = styled(StyledTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const LoadingOverlay = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
  backdropFilter: 'blur(2px)',
});

function EnhancedResultsView({ queryResult, result, loading, error, onRefresh }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Use the new prop names if available, fallback to old ones
  const actualResult = result || queryResult;
  const actualLoading = loading || false;

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const sortedData = useMemo(() => {
    if (!actualResult?.data || actualResult.type !== 'sql') {
      return [];
    }

    let sortableData = [...actualResult.data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [actualResult, sortConfig]);

  const paginatedData = useMemo(() => {
    return sortedData.slice(
      currentPage * rowsPerPage,
      currentPage * rowsPerPage + rowsPerPage
    );
  }, [sortedData, currentPage, rowsPerPage]);

  const exportToCsv = useCallback(() => {
    if (!actualResult?.data?.length) return;

    const headers = Object.keys(actualResult.data[0]);
    const csvContent = [
      headers.join(','),
      ...actualResult.data.map(row => 
        headers.map(header => 
          `"${String(row[header] || '').replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSnackbar('Exported to CSV successfully!', 'success');
  }, [actualResult]);

  const exportToJson = useCallback(() => {
    if (!actualResult?.data?.length) return;

    const jsonContent = JSON.stringify(actualResult.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSnackbar('Exported to JSON successfully!', 'success');
  }, [actualResult]);

  const renderEmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        p: 4,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <SearchIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" gutterBottom>
        No results to display
      </Typography>
      <Typography variant="body1">
        {error || 'Submit a query to see results here.'}
      </Typography>
    </Box>
  );

  const renderLoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Processing your query...
      </Typography>
    </Box>
  );

  const renderTable = (data, generatedSql) => {
    const tableData = data || actualResult?.data;
    if (!tableData?.length) return renderEmptyState();

    const columns = Object.keys(tableData[0]);

    return (
      <Box sx={{ position: 'relative' }}>
        {actualLoading && (
          <LoadingOverlay>
            <CircularProgress />
          </LoadingOverlay>
        )}
        
        {generatedSql && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Generated SQL: <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{generatedSql}</pre>
          </Alert>
        )}

        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            maxHeight: 'calc(100vh - 300px)',
            position: 'relative',
            borderRadius: 2,
            overflow: 'auto',
          }}
        >
          <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledTableHeaderCell key={column}>
                    <TableSortLabel
                      active={sortConfig.key === column}
                      direction={sortConfig.key === column ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column}
                    </TableSortLabel>
                  </StyledTableHeaderCell>
                ))}
                <StyledTableHeaderCell>Actions</StyledTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <StyledTableRow key={rowIndex} hover>
                  {columns.map((column) => (
                    <StyledTableCell key={`${rowIndex}-${column}`}>
                      <Box sx={{ 
                        maxWidth: 200, 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {String(row[column] ?? '')}
                      </Box>
                    </StyledTableCell>
                  ))}
                  <StyledTableCell>
                    <Tooltip title="Copy row">
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyToClipboard(JSON.stringify(row, null, 2))}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedData.length} of {sortedData.length} rows
            </Typography>
            {actualResult?.executionTimeMs && (
              <Chip 
                size="small" 
                label={`${actualResult.executionTimeMs.toFixed(2)} ms`} 
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={sortedData.length}
            rowsPerPage={rowsPerPage}
            page={currentPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end' } }}
          />
        </Box>
      </Box>
    );
  };

  const renderDocumentView = (documents, query) => {
    const docData = documents || actualResult?.documents;
    if (!docData?.length) return renderEmptyState();
    
    const highlightText = (text, query) => {
      if (!query) return text;
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
              <mark key={i} style={{ backgroundColor: '#ffeb3b', borderRadius: '3px' }}>
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    };

    return (
      <Box sx={{ mt: 2 }}>
        {docData.map((doc, index) => (
          <Paper 
            key={index} 
            elevation={2} 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: 2,
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" color="primary">
                {doc.source || `Document ${index + 1}`}
              </Typography>
              {doc.score !== undefined && (
                <Chip 
                  size="small" 
                  label={`Score: ${(doc.score * 100).toFixed(1)}%`}
                  color={doc.score > 0.7 ? 'success' : doc.score > 0.4 ? 'warning' : 'error'}
                  variant="outlined"
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {highlightText(doc.content, query)}
            </Typography>
            {doc.metadata && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(doc.metadata).map(([key, value]) => (
                  <Chip 
                    key={key}
                    size="small"
                    label={`${key}: ${value}`}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  };

  const renderHybridView = () => {
    const hasSqlData = actualResult?.sql_result?.data?.length > 0;
    const hasDocData = actualResult?.doc_result?.documents?.length > 0;

    if (!hasSqlData && !hasDocData) return renderEmptyState();

    return (
      <Box sx={{ mt: 2 }}>
        {hasSqlData && (
          <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>SQL Results</Typography>
            {renderTable(actualResult.sql_result.data, actualResult.sql_result.generated_sql)}
          </Paper>
        )}
        {hasDocData && (
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Document Results</Typography>
            {renderDocumentView(actualResult.doc_result.documents)}
          </Paper>
        )}
      </Box>
    );
  };

  if (actualLoading && !actualResult) {
    return renderLoadingState();
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!actualResult) {
    return renderEmptyState();
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ minHeight: 'auto' }}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          <Tab 
            icon={<TableIcon />} 
            label={isMobile ? '' : 'Table View'} 
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
            disabled={actualResult.type === 'hybrid' || !actualResult.data?.length}
          />
          <Tab 
            icon={<DocumentIcon />} 
            label={isMobile ? '' : 'Documents'} 
            iconPosition="start"
            disabled={actualResult.type === 'hybrid' || !actualResult.documents?.length}
            sx={{ minHeight: 'auto' }}
          />
          {actualResult.type === 'hybrid' && (
            <Tab 
              label={isMobile ? '' : 'Hybrid View'} 
              iconPosition="start"
              sx={{ minHeight: 'auto' }}
            />
          )}
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ButtonGroup size="small" variant="outlined" disabled={!actualResult.data?.length && !actualResult.documents?.length}>
            <Tooltip title="Export to CSV">
              <Button onClick={exportToCsv} startIcon={<FileDownloadIcon />}>
                {!isMobile && 'CSV'}
              </Button>
            </Tooltip>
            <Tooltip title="Export to JSON">
              <Button onClick={exportToJson} startIcon={<FileDownloadIcon />}>
                {!isMobile && 'JSON'}
              </Button>
            </Tooltip>
          </ButtonGroup>
          
          <Tooltip title="Refresh">
            <IconButton 
              onClick={onRefresh}
              color="primary"
              disabled={actualLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Fade in={!actualLoading} timeout={300}>
        <Box>
          {actualResult.type === 'hybrid' && renderHybridView()}
          {actualResult.type === 'sql' && tabValue === 0 && renderTable(actualResult.data, actualResult.generated_sql)}
          {actualResult.type === 'document' && tabValue === 1 && renderDocumentView(actualResult.documents, actualResult.query)}
          {actualResult.type === 'sql' && tabValue === 1 && renderDocumentView(actualResult.documents, actualResult.query)}
          {actualResult.type === 'document' && tabValue === 0 && renderTable(actualResult.data, actualResult.generated_sql)}
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EnhancedResultsView;

import React, { useState, useEffect, useMemo } from 'react';
import {
    CssBaseline,
    Container,
    Grid,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Paper,
    ThemeProvider,
    createTheme,
    Button,
    Box,
    Divider,
    useMediaQuery,
    Tooltip,
    Link,
    Avatar,
    alpha
} from '@mui/material';
import {
    Brightness4 as DarkIcon,
    Brightness7 as LightIcon,
    Refresh as RefreshIcon,
    GitHub as GitHubIcon,
    Code as CodeIcon,
    Storage as DatabaseIcon,
    Storage as StorageIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';

import apiClient from './api';
import DatabaseConnector from './components/DatabaseConnector';
import DocumentUploader from './components/DocumentUploader';
import QueryPanel from './components/QueryPanel';
import EnhancedResultsView from './components/EnhancedResultsView';
// SchemaVisualizer is intentionally omitted from the main layout as per user's request for a minimal sidebar.
// It can be integrated within DatabaseConnector or as a separate modal if needed.

function App() {
    const isMobile = useMediaQuery('(max-width: 900px)');
    const [schema, setSchema] = useState(null);
    const [queryResult, setQueryResult] = useState(null);
    const [queryHistory, setQueryHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [dbConnected, setDbConnected] = useState(false);
    const [metrics, setMetrics] = useState({
        queriesProcessed: 0,
        documentsIndexed: 0,
        avgResponseTime: 0,
        lastUpdated: null
    });

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: darkMode ? 'dark' : 'light',
                    primary: {
                        main: darkMode ? '#90caf9' : '#1976d2',
                        light: darkMode ? '#e3f2fd' : '#42a5f5',
                        dark: darkMode ? '#42a5f5' : '#1565c0',
                        contrastText: '#ffffff',
                    },
                    secondary: {
                        main: darkMode ? '#4caf50' : '#2e7d32',
                        light: darkMode ? '#81c784' : '#4caf50',
                        dark: darkMode ? '#2e7d32' : '#1b5e20',
                        contrastText: '#ffffff',
                    },
                    background: {
                        default: darkMode ? '#121212' : '#f8f9fa',
                        paper: darkMode ? '#1e1e1e' : '#ffffff',
                    },
                    text: {
                        primary: darkMode ? '#ffffff' : '#000000', // Black for light mode
                        secondary: darkMode ? '#b0b0b0' : '#333333', // Very dark grey for light mode
                    },
                },
                typography: {
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif',
                    h1: {
                        fontWeight: 700,
                        fontSize: '2.5rem',
                        background: darkMode 
                            ? 'linear-gradient(90deg, #90caf9, #64b5f6)' 
                            : 'linear-gradient(90deg, #1976d2, #2196f3)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    },
                    h2: {
                        fontWeight: 600,
                        fontSize: '2rem',
                    },
                    h3: {
                        fontWeight: 600,
                        fontSize: '1.5rem',
                    },
                    button: {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                },
                shape: {
                    borderRadius: 12,
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                                textTransform: 'none',
                                fontWeight: 500,
                                padding: '8px 16px',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                },
                            },
                            contained: {
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                },
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
                                boxShadow: darkMode 
                                    ? '0 8px 16px rgba(0, 0, 0, 0.2)' 
                                    : '0 6px 12px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: darkMode 
                                        ? '0 12px 20px rgba(0, 0, 0, 0.25)' 
                                        : '0 8px 16px rgba(0, 0, 0, 0.1)',
                                },
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                background: darkMode 
                                    ? 'rgba(30, 30, 30, 0.8)' 
                                    : '#ffffff',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            },
                        },
                    },
                    MuiTypography: {
                        styleOverrides: {
                            root: {
                                color: theme => theme.palette.mode === 'light' ? theme.palette.text.primary : 'inherit',
                            },
                        },
                    },
                },
            }),
        [darkMode],
    );

    const fetchSchema = async () => {
        try {
            const response = await apiClient.get('/schema/');
            setSchema(response.data);
            setDbConnected(true);
        } catch (err) {
            setError('Could not fetch schema. Is the backend running?');
            setSchema(null);
            setDbConnected(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get('/query/history');
            setQueryHistory(response.data);
        } catch (err) {
            // Non-critical error
            console.error("Could not fetch query history.");
        }
    };

    const fetchMetrics = async () => {
        try {
            // Mock metrics since the endpoint is not available
            setMetrics(prev => ({
                queriesProcessed: queryHistory.length,
                documentsIndexed: 0, // Will be updated after successful upload
                avgResponseTime: 0,
                lastUpdated: new Date().toLocaleTimeString()
            }));
        } catch (err) {
            console.error('Error in metrics:', err);
            setMetrics(prev => ({
                ...prev,
                lastUpdated: new Date().toLocaleTimeString()
            }));
        }
    };
    
    const incrementDocumentsIndexed = () => {
        setMetrics(prev => ({
            ...prev,
            documentsIndexed: (prev.documentsIndexed || 0) + 1
        }));
    };

    useEffect(() => {
        fetchSchema();
        fetchHistory();
        fetchMetrics();
        
        // Refresh metrics every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleQuery = async (query) => {
        console.log('Executing query:', query);
        setLoading(true);
        setError('');
        setQueryResult(null);
        try {
            const response = await apiClient.post('/query/', { query });
            console.log('Query response:', response.data);
            setQueryResult(response.data);
            await fetchHistory(); // Refresh history after a successful query
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'An error occurred while querying.';
            console.error('Query error:', errorMsg, err);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDbConnect = () => {
        // After connecting, refresh the schema
        fetchSchema();
        // Clear old results
        setQueryResult(null);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary, // Explicitly set default text color
            }}>
                <AppBar position="sticky" elevation={0}>
                    <Container maxWidth="xl">
                        <Toolbar disableGutters sx={{ minHeight: 72 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                <DatabaseIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography
                                    variant="h6"
                                    noWrap
                                    component="div"
                                    sx={{
                                        mr: 2,
                                        fontWeight: 700,
                                        letterSpacing: '0.5px',
                                        display: { xs: 'none', md: 'flex' },
                                    }}
                                >
                                    NLP QueryEngine
                                </Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title="View on GitHub">
                                    <IconButton 
                                        component="a"
                                        href="https://github.com/pranavsinghpatil"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="inherit"
                                        sx={{
                                            '&:hover': {
                                                color: 'primary.main',
                                                transform: 'translateY(-2px)',
                                            },
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <GitHubIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                                    <IconButton
                                        onClick={() => setDarkMode(!darkMode)}
                                        color="inherit"
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                transform: 'scale(1.05)',
                                            },
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {darkMode ? (
                                            <LightIcon sx={{ color: 'primary.main' }} />
                                        ) : (
                                            <DarkIcon sx={{ color: 'primary.main' }} />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>

                <Container 
                    maxWidth={false} 
                    sx={{ 
                        flexGrow: 1, 
                        p: { xs: 1, sm: 2, md: 3 },
                        pt: { xs: 2, sm: 3 },
                        maxWidth: '1920px'
                    }}
                >
                    <Grid 
                        container 
                        spacing={isMobile ? 2 : 3}
                        sx={{ 
                            height: 'calc(100vh - 64px - 48px)', // Adjust for header and container padding
                            alignItems: 'stretch',
                            '& > .MuiGrid-item': {
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: '100%'
                            }
                        }}
                    >
                        {/* Sidebar for Database and Document Upload */}
                        <Grid item xs={12} md={3}>
                            <Paper 
                                elevation={2}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                    p: 3,
                                    borderRadius: 2,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        boxShadow: `0 8px 16px ${theme.palette.mode === 'dark' 
                                            ? 'rgba(0, 0, 0, 0.3)' 
                                            : 'rgba(0, 0, 0, 0.1)'}`,
                                    },
                                    border: `1px solid ${theme.palette.divider}`,
                                    backgroundColor: theme.palette.background.paper,
                                }}
                            >
                                <DatabaseConnector onConnect={handleDbConnect} />
                                <Divider sx={{ my: 1 }} />
                                <DocumentUploader onUploadSuccess={incrementDocumentsIndexed} />
                            </Paper>
                        </Grid>

                        {/* Main Content Area */}
                        <Grid item xs={12} md={9}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                                <Paper sx={{
                                    p: 2,
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    },
                                }}>
                                    <QueryPanel onQuery={handleQuery} queryHistory={queryHistory} loading={loading} />
                                </Paper>
                                <Paper sx={{
                                    p: 2,
                                    flexGrow: 1,
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    },
                                }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Results
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            onClick={() => {
                                                fetchSchema();
                                                fetchHistory();
                                            }}
                                            disabled={loading}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>

                <Box 
                    component="footer"
                    sx={{
                        mt: 'auto',
                        py: 3,
                        backgroundColor: theme => 
                            theme.palette.mode === 'dark' 
                                ? 'rgba(30, 30, 30, 0.8)' 
                                : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Container maxWidth="xl">
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StorageIcon color="action" fontSize="small" />
                                    <Typography variant="body2" color="text.secondary">
                                        Queries: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{metrics.queriesProcessed}</Box>
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <UploadIcon color="action" fontSize="small" />
                                    <Typography variant="body2" color="text.secondary">
                                        Documents: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{metrics.documentsIndexed}</Box>
                                    </Typography>
                                </Box>
                                {metrics.avgResponseTime > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CodeIcon color="action" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            Response: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{metrics.avgResponseTime}ms</Box>
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    © {new Date().getFullYear()} 
                                    <Link 
                                        href="https://github.com/pranavsinghpatil" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        color="primary"
                                        sx={{
                                            ml: 0.5,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        PranavSingh
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

// Error Boundary Component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Error caught by error boundary:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Something went wrong. Please refresh the page.</Typography>
      </Box>
    );
  }

  return children;
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
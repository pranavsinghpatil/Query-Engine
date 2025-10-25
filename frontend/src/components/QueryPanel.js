import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  History as HistoryIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const QueryInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input': {
    color: theme.palette.text.primary,
    fontFamily: 'monospace',
  },
  width: '100%',
  marginBottom: theme.spacing(2),
}));

const SuggestionItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const SuggestionsContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  maxHeight: 200,
  overflow: 'auto',
  zIndex: 1,
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
}));

function QueryPanel({ connectionString, onQueryResult, onQuery, history = [], loading: externalLoading }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [schema, setSchema] = useState(null);
  const [localHistory, setLocalHistory] = useState(history || []);

  // Simple debounce utility
  const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  useEffect(() => {
    const fetchSchema = async () => {
      if (connectionString) {
        try {
          const response = await fetch('/api/schema');
          if (response.ok) {
            const data = await response.json();
            setSchema(data.schema);
          }
        } catch (error) {
          console.error('Failed to fetch schema:', error);
        }
      }
    };
    fetchSchema();
  }, [connectionString]);

  useEffect(() => {
    if (history) {
      setLocalHistory(history);
    }
  }, [history]);

  const debouncedSuggest = useCallback(
    debounce((inputValue) => {
      if (!inputValue.trim() || !schema) {
        setSuggestions([]);
        return;
      }

      const lowerCaseValue = inputValue.toLowerCase();
      const newSuggestions = [];

      // Add table suggestions
      Object.keys(schema.tables).forEach(tableName => {
        if (tableName.toLowerCase().includes(lowerCaseValue)) {
          newSuggestions.push({ type: 'table', name: tableName });
        }
      });

      // Add column suggestions
      Object.keys(schema.tables).forEach(tableName => {
        const table = schema.tables[tableName];
        table.columns.forEach(col => {
          const fullColName = `${tableName}.${col.name}`;
          if (col.name.toLowerCase().includes(lowerCaseValue) || fullColName.toLowerCase().includes(lowerCaseValue)) {
            newSuggestions.push({ type: 'column', name: fullColName });
          }
        });
      });

      // Prioritize exact matches and then partial matches
      const exactMatches = newSuggestions.filter(s => s.name.toLowerCase() === lowerCaseValue);
      const partialMatches = newSuggestions.filter(s => s.name.toLowerCase() !== lowerCaseValue);

      setSuggestions([...exactMatches, ...partialMatches].slice(0, 10));

    }, 300), // 300ms debounce time
    [schema]
  );

  // Ensure debounce is cleaned up on unmount
  useEffect(() => {
    return () => {
      // debouncedSuggest.cancel(); // No cancel method on simple debounce
    };
  }, [debouncedSuggest]);

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleHistoryClick = (query) => {
    setQuery(query);
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      setMessage('Please enter a query.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (onQuery) {
        // Use the new onQuery prop if available
        await onQuery(query);
        setMessage('Query executed successfully.');
      } else if (onQueryResult) {
        // Fallback to old method
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_query: query, connection_string: connectionString }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.error) {
            setMessage(`Error: ${data.error}`);
            onQueryResult(data);
          } else {
            setMessage('Query executed successfully.');
            onQueryResult(data);
          }
        } else {
          setMessage(`Error: ${data.detail || 'Failed to process query'}`);
          onQueryResult(data);
        }
      }
    } catch (error) {
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [showHistory, setShowHistory] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ 
        fontWeight: 600,
        mb: 3,
        color: 'text.primary'
      }}>
        Query Panel
      </Typography>
      
      <Box sx={{ position: 'relative' }}>
        <QueryInput
          multiline
          minRows={2}
          maxRows={8}
          placeholder="Enter your natural language query (e.g., 'Show me all employees in Engineering department')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading || externalLoading}
          variant="outlined"
          fullWidth
        />
        
        {suggestions.length > 0 && (
          <SuggestionsContainer>
            <List dense>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <SuggestionItem 
                  key={index} 
                  onClick={() => handleSuggestionClick(suggestion.name)}
                >
                  <ListItemText 
                    primary={suggestion.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.primary',
                      fontFamily: 'monospace',
                    }}
                    secondary={suggestion.type}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                </SuggestionItem>
              ))}
            </List>
          </SuggestionsContainer>
        )}
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2, 
        mt: 2,
        mb: 3
      }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleQuerySubmit}
          disabled={(loading || externalLoading) || !query.trim()}
          startIcon={loading || externalLoading ? <CircularProgress size={20} /> : <SendIcon />}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            py: 1.5,
            fontWeight: 500,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.shadows[2],
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {loading || externalLoading ? 'Processing...' : 'Submit Query'}
        </Button>
        
        <Box sx={{ position: 'relative' }}>
          <Button
            variant="outlined"
            onClick={() => setShowHistory(!showHistory)}
            startIcon={<HistoryIcon />}
            endIcon={showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            fullWidth={isMobile}
            sx={{
              textTransform: 'none',
              py: 1.5,
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.secondary',
                backgroundColor: 'action.hover',
              },
            }}
          >
            History
          </Button>
          
          <Collapse in={showHistory} sx={{ 
            position: 'absolute',
            width: '100%',
            zIndex: 1,
            mt: 1,
          }}>
            <Paper 
              elevation={3}
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                backgroundColor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              {localHistory.length > 0 ? (
                <List dense>
                  {localHistory.map((item, index) => (
                    <SuggestionItem 
                      key={index} 
                      onClick={() => {
                        handleHistoryClick(item);
                        setShowHistory(false);
                      }}
                    >
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.primary',
                          sx: {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }
                        }}
                      />
                    </SuggestionItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No query history yet
                  </Typography>
                </Box>
              )}
            </Paper>
          </Collapse>
        </Box>
      </Box>
      
      {message && (
        <Typography 
          variant="body2" 
          sx={{
            color: message.type === 'error' ? 'error.main' : 'success.main',
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: message.type === 'error' 
              ? 'rgba(211, 47, 47, 0.1)' 
              : 'rgba(46, 125, 50, 0.1)',
          }}
        >
          {message.text}
        </Typography>
      )}
    </Box>
  );
}

export default QueryPanel;
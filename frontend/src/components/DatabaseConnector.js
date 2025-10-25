import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import SchemaVisualizer from './SchemaVisualizer';

function DatabaseConnector({ connectionString, setConnectionString, setSchema, onConnect }) {
  const [message, setMessage] = useState('');
  const [localSchema, setLocalSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localConnectionString, setLocalConnectionString] = useState(connectionString || '');

  const handleTestConnection = async () => {
    const connString = connectionString || localConnectionString;
    if (!connString || !connString.trim()) {
      setMessage('Error: Please enter a connection string.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/ingest/connect-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_string: connString }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Connection successful!');
      } else {
        setMessage(`Error: ${data.detail || 'Failed to connect to database. Check connection string and backend status.'}`);
      }
    } catch (error) {
      console.error('Network error during test connection:', error);
      setMessage(`Error: Network error. Ensure backend is running and accessible. (${error.message || String(error)})`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAndAnalyze = async () => {
    const connString = connectionString || localConnectionString;
    if (!connString || !connString.trim()) {
      setMessage('Error: Please enter a connection string.');
      return;
    }

    setLoading(true);
    setMessage('');
    setLocalSchema(null);
    if (setSchema) setSchema(null);

    try {
      const response = await fetch('/api/ingest/connect-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_string: connString }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setLocalSchema(data.schema);
        if (setSchema) setSchema(data.schema);
        if (onConnect) onConnect();
      } else {
        setMessage(`Error: ${data.detail || 'Failed to connect and analyze database. Check connection string and backend status.'}`);
      }
    } catch (error) {
      console.error('Network error during connect and analyze:', error);
      setMessage(`Error: Network error. Ensure backend is running and accessible. (${error.message || String(error)})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6" gutterBottom>Database Connector</Typography>
      
      <TextField
        label="Connection String"
        variant="outlined"
        size="small"
        fullWidth
        value={connectionString || localConnectionString}
        onChange={(e) => {
          if (setConnectionString) {
            setConnectionString(e.target.value);
          } else {
            setLocalConnectionString(e.target.value);
          }
        }}
        disabled={loading}
        placeholder="e.g., sqlite:///./test.db"
      />
      
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button 
          variant="outlined" 
          onClick={handleTestConnection} 
          disabled={loading || !(connectionString || localConnectionString)?.trim()}
          fullWidth
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button 
          variant="contained" 
          onClick={handleConnectAndAnalyze} 
          disabled={loading || !(connectionString || localConnectionString)?.trim()}
          fullWidth
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Connecting...' : 'Connect & Analyze'}
        </Button>
      </Box>
      
      {message && (
        <Typography 
          variant="body2" 
          color={message.startsWith('Error') ? 'error' : 'success.main'}
          sx={{ mt: 1 }}
        >
          {message.startsWith('Error') ? '❌' : '✅'} {message}
        </Typography>
      )}
      
      {localSchema && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Discovered Schema:</Typography>
          <SchemaVisualizer schema={localSchema} />
        </Box>
      )}
    </Box>
  );
}

export default DatabaseConnector;
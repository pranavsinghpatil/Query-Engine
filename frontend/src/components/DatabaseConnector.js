import React, { useState } from 'react';
import './DatabaseConnector.css';
import SchemaVisualizer from './SchemaVisualizer';

function DatabaseConnector({ connectionString, setConnectionString, setSchema }) {
  const [message, setMessage] = useState('');
  const [schema, setLocalSchema] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setMessage('');
    setLocalSchema(null);
    setSchema(null);

    try {
      const response = await fetch('/api/ingest/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_string: connectionString }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setLocalSchema(data.schema);
        setSchema(data.schema);
      } else {
        setMessage(`Error: ${data.detail || 'Failed to connect to database'}`);
      }
    } catch (error) {
      console.error('Full error object:', error);
      setMessage(`Network error: ${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="database-connector">
      <h2>Database Connector</h2>
      <div>
        <input
          type="text"
          placeholder="Enter database connection string (e.g., sqlite:///./test.db)"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
        />
        <button onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect & Analyze'}
        </button>
      </div>
      {message && <p className={message.startsWith('Error') ? 'error-message' : 'success-message'}>{message}</p>}
      
      <SchemaVisualizer schema={schema} />
    </div>
  );
}

export default DatabaseConnector;
import React, { useState, useEffect } from 'react';
import './QueryPanel.css';

function QueryPanel({ connectionString, onQueryResult }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [schema, setSchema] = useState(null);
  const [history, setHistory] = useState([]);

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
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/query/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };
    fetchHistory();
  }, [loading]);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() && schema) {
      const lowerCaseValue = value.toLowerCase();
      const allColumns = Object.values(schema.tables).flatMap(table => table.columns.map(col => col.name));
      const allTables = Object.keys(schema.tables);
      
      const newSuggestions = [...allTables, ...allColumns].filter(item =>
        item.toLowerCase().includes(lowerCaseValue)
      );
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const handleHistoryClick = (query) => {
    setQuery(query);
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      setMessage('Please enter a query.');
      return;
    }
    if (!connectionString.trim()) {
      setMessage('Please connect to a database first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
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
    } catch (error) {
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-panel">
      <h2>Query Panel</h2>
      <div>
        <input
          type="text"
          placeholder="Enter your natural language query"
          value={query}
          onChange={handleQueryChange}
        />
        <button onClick={handleQuerySubmit} disabled={loading || !connectionString}>
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
        <div className="history-dropdown">
          <button>History</button>
          <div className="history-content">
            {history.map((h, i) => (
              <p key={i} onClick={() => handleHistoryClick(h)}>{h}</p>
            ))}
          </div>
        </div>
      </div>
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => handleSuggestionClick(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
      {loading && <p>Loading...</p>}
      {message && <p className={message.startsWith('Error') ? 'error-message' : 'success-message'}>{message}</p>}
    </div>
  );
}

export default QueryPanel;
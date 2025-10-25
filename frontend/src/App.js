import React, { useState, useEffect } from 'react';
import './App.css';
import DatabaseConnector from './components/DatabaseConnector';
import DocumentUploader from './components/DocumentUploader';
import QueryPanel from './components/QueryPanel';
import ResultsView from './components/ResultsView';
import MetricsDashboard from './components/MetricsDashboard';

function App() {
  const [queryResult, setQueryResult] = useState(null);
  const [connectionString, setConnectionString] = useState('');
  const [theme, setTheme] = useState('light');
  const [schema, setSchema] = useState(null);
  const [dbStatus, setDbStatus] = useState({ connected: false });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.body.className = theme + '-mode';
  }, [theme]);

  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const response = await fetch('/api/db/status');
        if (response.ok) {
          const data = await response.json();
          setDbStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch db status:', error);
      }
    };
    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>NLP Query Engine</h1>
        <button onClick={toggleTheme}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>
      </header>
      <main>
        <DatabaseConnector connectionString={connectionString} setConnectionString={setConnectionString} setSchema={setSchema} />
        <DocumentUploader />
        <QueryPanel connectionString={connectionString} onQueryResult={setQueryResult} />
        <ResultsView queryResult={queryResult} />
        <MetricsDashboard queryResult={queryResult} schema={schema} dbStatus={dbStatus} />
      </main>
    </div>
  );
}

export default App;
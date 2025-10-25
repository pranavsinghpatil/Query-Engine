import React from 'react';
import './MetricsDashboard.css';

function MetricsDashboard({ queryResult, schema, dbStatus }) {
  if (!queryResult && !schema) {
    return null;
  }

  const getTableCount = () => {
    if (!schema) return 0;
    return Object.keys(schema.tables).length;
  };

  const getColumnCount = () => {
    if (!schema) return 0;
    return Object.values(schema.tables).reduce((acc, table) => acc + table.columns.length, 0);
  };

  return (
    <div className="metrics-dashboard">
      <h2>Metrics Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Tables</h3>
          <p>{getTableCount()}</p>
        </div>
        <div className="metric-card">
          <h3>Columns</h3>
          <p>{getColumnCount()}</p>
        </div>
        {queryResult && (
          <>
            <div className="metric-card">
              <h3>Query Time</h3>
              <p>{queryResult.performance_metrics?.response_time.toFixed(2)}s</p>
            </div>
            <div className="metric-card">
              <h3>Cache Hit</h3>
              <p>{queryResult.cached ? 'Yes' : 'No'}</p>
            </div>
          </>
        )}
        <div className="metric-card">
          <h3>DB Connection</h3>
          <p className={dbStatus.connected ? 'connected' : 'disconnected'}>
            {dbStatus.connected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MetricsDashboard;

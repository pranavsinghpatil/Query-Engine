import React from 'react';
import './MetricsDashboard.css';

function MetricsDashboard({ queryResult, schema, dbStatus, result }) {
  // Use the new prop names if available, fallback to old ones
  const actualResult = result || queryResult;
  const getTableCount = () => {
    if (!schema) return 0;
    return Object.keys(schema.tables).length;
  };

  const getColumnCount = () => {
    if (!schema) return 0;
    return Object.values(schema.tables).reduce((acc, table) => acc + table.columns.length, 0);
  };

  const getResponseTime = () => {
    if (!actualResult?.response_time) return null;
    return `${actualResult.response_time}ms`;
  };

  const getCacheStatus = () => {
    if (!actualResult) return null;
    return actualResult.cached ? 'Hit' : 'Miss';
  };

  if (!actualResult && !schema && !dbStatus) {
    return (
      <div className="metrics-dashboard">
        <h2>Metrics Dashboard</h2>
        <div className="empty-state">
          Connect to a database and run queries to see metrics
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard">
      <h2>Metrics Dashboard</h2>
      <div className="metrics-grid">
        {schema && (
          <>
            <div className="metric-card">
              <h3 data-icon="tables">Tables</h3>
              <p className="metric-value">{getTableCount()}</p>
              <p className="metric-description">Discovered tables</p>
            </div>
            <div className="metric-card">
              <h3 data-icon="columns">Columns</h3>
              <p className="metric-value">{getColumnCount()}</p>
              <p className="metric-description">Total columns</p>
            </div>
          </>
        )}
        
        {actualResult && (
          <>
            {getResponseTime() && (
              <div className="metric-card">
                <h3 data-icon="query-time">Query Time</h3>
                <p className="metric-value">{getResponseTime()}</p>
                <p className="metric-description">Response time</p>
              </div>
            )}
            <div className="metric-card">
              <h3 data-icon="cache">Cache</h3>
              <p className={`metric-value ${actualResult.cached ? 'success' : 'warning'}`}>
                {getCacheStatus()}
              </p>
              <p className="metric-description">Cache status</p>
            </div>
          </>
        )}
        
        <div className="metric-card">
          <h3 data-icon="connection">DB Connection</h3>
          <div className={`connection-status ${dbStatus?.connected ? 'connected' : 'disconnected'}`}>
            {dbStatus?.connected ? 'Connected' : 'Disconnected'}
          </div>
          <p className="metric-description">Database status</p>
        </div>
      </div>
    </div>
  );
}

export default MetricsDashboard;

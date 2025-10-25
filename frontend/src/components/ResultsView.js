import React, { useState, useMemo } from 'react';
import './ResultsView.css';

function ResultsView({ queryResult, result, loading, error }) {
  // Use the new prop names if available, fallback to old ones
  const actualResult = result || queryResult;
  const actualLoading = loading || false;

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const rowsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!actualResult || !actualResult.data || actualResult.type !== 'sql') {
      return [];
    }
    let sortableData = [...actualResult.data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [actualResult, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * rowsPerPage;
    const lastPageIndex = firstPageIndex + rowsPerPage;
    return sortedData.slice(firstPageIndex, lastPageIndex);
  }, [sortedData, currentPage]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const exportToCsv = () => {
    if (!actualResult || !actualResult.data) return;

    const headers = Object.keys(actualResult.data[0]);
    const csvContent = [
      headers.join(','),
      ...actualResult.data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'results.csv';
    link.click();
  };

  const exportToJson = () => {
    if (!actualResult || !actualResult.data) return;

    const jsonContent = JSON.stringify(actualResult.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'results.json';
    link.click();
  };

  if (!actualResult && !actualLoading) {
    return (
      <div className="results-view">
        <h2>Results View</h2>
        <div className="empty-state">
          No results to display yet. Submit a query to see results here.
        </div>
      </div>
    );
  }

  if (actualLoading) {
    return (
      <div className="results-view">
        <h2>Results View</h2>
        <div className="loading-state">
          <span className="loading-spinner"></span>
          Processing your query...
        </div>
      </div>
    );
  }

  const { sql, data, error: resultError, cached, response_time } = actualResult || {};

  const actualError = error || resultError || null;



  return (
    <div className="results-view">
      <h2>Results View</h2>
      
      <div className="results-header">
        <div className="query-info">
          <span className="query-type">{actualResult?.type || 'unknown'}</span>
          {cached && <span className="cached-indicator">Cached Result</span>}
        </div>
        <div className="performance-metrics">
          {response_time && <span className="metric">{response_time}ms</span>}
        </div>
      </div>
      
      {(error || actualError) && <div className="error-message">Error: {error || actualError}</div>}

      {actualResult?.type === 'sql' && data && (
        <div>
          {sql && <div className="sql-query">{sql}</div>}
          {data.length > 0 ? (
            <>
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {data[0] && typeof data[0] === 'object' && Object.keys(data[0]).map((key) => (
                          <th key={key} onClick={() => requestSort(key)}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row && typeof row === 'object' ? (
                            Object.values(row).map((value, colIndex) => (
                              <td key={colIndex}>
                                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                              </td>
                            ))
                          ) : (
                            <td colSpan={Object.keys(data[0] || {}).length}>
                              {String(row)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} results
                  </div>
                  <div className="pagination-controls">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      ← Previous
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedData.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(sortedData.length / rowsPerPage)}>
                      Next →
                    </button>
                  </div>
                </div>
              </div>
              <div className="export-section">
                <button className="export-button" onClick={exportToCsv}>
                  Export as CSV
                </button>
                <button className="export-button" onClick={exportToJson}>
                  Export as JSON
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              No data found for this query.
            </div>
          )}
        </div>
      )}

      {actualResult?.type === 'document' && data && (
        <div className="document-results">
          <h3>Document Search Results</h3>
          {data.length > 0 ? (
            <div className="document-results-list">
              {data.map((doc, index) => (
                <div key={index} className="document-result">
                  <div className="document-header">
                    <span className="document-filename">{doc.file_path}</span>
                    <span className="similarity-score">{(doc.similarity * 100).toFixed(1)}% match</span>
                  </div>
                  <div className="document-content">{doc.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No relevant documents found.
            </div>
          )}
        </div>
      )}

      {actualResult?.type === 'hybrid' && (
        <div>
          <h3>Hybrid Query Result:</h3>
          {actualResult?.sql_result && (
            <div>
              <h4>SQL Result:</h4>
              <p><strong>Generated SQL:</strong> {actualResult.sql_result.sql}</p>
              {actualResult.sql_result.data.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(actualResult.sql_result.data[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actualResult.sql_result.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex}>
                              {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No data found for this query.</p>
              )}
            </div>
          )}
          {actualResult?.doc_result && (
            <div>
              <h4>Document Search Results:</h4>
              {actualResult.doc_result.data.length > 0 ? (
                <div className="document-results">
                  {actualResult.doc_result.data.map((doc, index) => (
                    <div key={index} className="document-result">
                      <h4>File: {doc.file_path} (Chunk ID: {doc.chunk_id})</h4>
                      <p><strong>Similarity:</strong> {doc.similarity.toFixed(4)}</p>
                      <p>{doc.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No relevant documents found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {(actualResult?.type !== 'sql' && actualResult?.type !== 'document' && actualResult?.type !== 'hybrid' && !error && !actualError) && (
        <p>Display for {actualResult?.type} results not yet implemented.</p>
      )}
    </div>
  );
}

export default ResultsView;
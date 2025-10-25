import React, { useState, useMemo } from 'react';
import './ResultsView.css';

function ResultsView({ queryResult }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const rowsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!queryResult || !queryResult.data || queryResult.type !== 'sql') {
      return [];
    }
    let sortableData = [...queryResult.data];
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
  }, [queryResult, sortConfig]);

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
    if (!queryResult || !queryResult.data) return;

    const headers = Object.keys(queryResult.data[0]);
    const csvContent = [
      headers.join(','),
      ...queryResult.data.map(row => headers.map(header => row[header]).join(','))
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
    if (!queryResult || !queryResult.data) return;

    const jsonContent = JSON.stringify(queryResult.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'results.json';
    link.click();
  };

  if (!queryResult) {
    return (
      <div className="results-view">
        <h2>Results View</h2>
        <p>No results to display yet.</p>
      </div>
    );
  }

  const { sql, data, error, cached } = queryResult;

  return (
    <div className="results-view">
      <h2>Results View</h2>
      {cached && <p className="cached-result"> (Cached Result)</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {queryResult.type === 'sql' && data && (
        <div>
          <h3>SQL Query Result:</h3>
          <p><strong>Generated SQL:</strong> {sql}</p>
          {data.length > 0 ? (
            <>
              <div className="table-container">
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
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {Math.ceil(sortedData.length / rowsPerPage)}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedData.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(sortedData.length / rowsPerPage)}>
                  Next
                </button>
              </div>
              <div className="export-buttons">
                <button onClick={exportToCsv}>Export as CSV</button>
                <button onClick={exportToJson}>Export as JSON</button>
              </div>
            </>
          ) : (
            <p>No data found for this query.</p>
          )}
        </div>
      )}

      {queryResult.type === 'document' && data && (
        <div>
          <h3>Document Search Results:</h3>
          {data.length > 0 ? (
            <div className="document-results">
              {data.map((doc, index) => (
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

      {queryResult.type === 'hybrid' && (
        <div>
          <h3>Hybrid Query Result:</h3>
          {queryResult.sql_result && (
            <div>
              <h4>SQL Result:</h4>
              <p><strong>Generated SQL:</strong> {queryResult.sql_result.sql}</p>
              {queryResult.sql_result.data.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(queryResult.sql_result.data[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.sql_result.data.map((row, rowIndex) => (
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
          {queryResult.doc_result && (
            <div>
              <h4>Document Search Results:</h4>
              {queryResult.doc_result.data.length > 0 ? (
                <div className="document-results">
                  {queryResult.doc_result.data.map((doc, index) => (
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

      {(queryResult.type !== 'sql' && queryResult.type !== 'document' && queryResult.type !== 'hybrid' && !error) && (
        <p>Display for {queryResult.type} results not yet implemented.</p>
      )}
    </div>
  );
}

export default ResultsView;
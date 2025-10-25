import React from 'react';
import './SchemaVisualizer.css';

function SchemaVisualizer({ schema }) {
  if (!schema) {
    return (
      <div className="schema-section">
        <div className="empty-state">
          Connect to a database to see the discovered schema
        </div>
      </div>
    );
  }

  return (
    <div className="schema-section">
      <h3>Discovered Schema</h3>
      <ul className="schema-view">
        {Object.keys(schema.tables).map((tableName) => (
          <li key={tableName}>
            <div className="table-name">{tableName}</div>
            <ul className="columns-list">
              {schema.tables[tableName].columns.map((col) => (
                <li key={`${tableName}-${col.name}`}>
                  <span className="col-name">{col.name}</span>
                  <span className="col-type">{col.type}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SchemaVisualizer;

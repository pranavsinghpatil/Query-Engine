import React from 'react';
import './SchemaVisualizer.css';

function SchemaVisualizer({ schema }) {
  if (!schema) {
    return null;
  }

  return (
    <div className="schema-visualizer">
      <h3>Discovered Schema</h3>
      <ul className="tree-view">
        {Object.keys(schema.tables).map((tableName) => (
          <li key={tableName}>
            <details>
              <summary>{tableName}</summary>
              <ul>
                {schema.tables[tableName].columns.map((col) => (
                  <li key={`${tableName}-${col.name}`}>
                    <span title={`Column Name: ${col.name}\nData Type: ${col.type}`}>{col.name} - <span className="col-type">{col.type}</span></span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SchemaVisualizer;

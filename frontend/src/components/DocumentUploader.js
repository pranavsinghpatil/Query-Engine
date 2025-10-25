import React, { useState, useRef } from 'react';
import './DocumentUploader.css';

function DocumentUploader() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({});
  const xhrRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const filePreviews = files.map(file => {
      return { file, preview: URL.createObjectURL(file) };
    });
    setSelectedFiles(filePreviews);
    setMessage('');
    setProgress({});
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const filePreviews = files.map(file => {
      return { file, preview: URL.createObjectURL(file) };
    });
    setSelectedFiles(filePreviews);
    setMessage('');
    setProgress({});
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select files to upload.');
      return;
    }

    setUploading(true);
    setMessage('Uploading and processing documents...');
    setProgress({});

    const formData = new FormData();
    selectedFiles.forEach(({ file }) => {
      formData.append('files', file);
    });

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress({ overall: percentComplete });
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setMessage(data.message);
      } else {
        const data = JSON.parse(xhr.responseText);
        setMessage(`Error: ${data.detail || 'Failed to upload documents'}`);
      }
      setSelectedFiles([]);
    };

    xhr.onerror = () => {
      setUploading(false);
      setMessage('Network error occurred during upload.');
    };

    xhr.onabort = () => {
      setUploading(false);
      setMessage('Upload canceled.');
    };

    xhr.open('POST', '/api/ingest/documents', true);
    xhr.send(formData);
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  return (
    <div className="document-uploader">
      <h2>Document Uploader</h2>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="drop-zone"
      >
        <p>Drag & drop files here, or click to select</p>
        <input type="file" multiple onChange={handleFileChange} id="fileInput" />
        <label htmlFor="fileInput">
          Select Files
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files:</h4>
          <div className="file-previews">
            {selectedFiles.map(({ file, preview }, index) => (
              <div key={index} className="file-preview">
                <img src={preview} alt={file.name} />
                <p>{file.name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? `Uploading...` : 'Upload Documents'}
          </button>
          {uploading && (
            <button onClick={handleCancelUpload} className="cancel-button">
              Cancel
            </button>
          )}
        </div>
      )}

      {uploading && progress.overall && (
        <div className="progress-bar">
          <p>Overall Progress:</p>
          <progress value={progress.overall} max="100"></progress>
        </div>
      )}

      {message && <p className={message.startsWith('Error') ? 'error-message' : 'success-message'}>{message}</p>}
    </div>
  );
}

export default DocumentUploader;
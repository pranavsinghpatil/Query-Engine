import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import { CloudUpload, InsertDriveFile, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import apiClient from '../api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DropZone = styled(Paper)(({ theme, isdragover }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: isdragover 
    ? theme.palette.action.hover 
    : theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  minHeight: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const FilePreview = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.75, 1.25),
  marginBottom: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
  '&:last-child': {
    marginBottom: 0,
  },
}));

function DocumentUploader({ onUploadSuccess }) {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const processFiles = (fileList) => {
        return Array.from(fileList).map(file => ({
            file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.name.split('.').pop().toLowerCase(),
            status: 'pending',
            progress: 0
        }));
    };
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const xhrRefs = useRef({});

  const getFileIcon = (fileType) => {
    const iconMap = {
      'pdf': 'PDF',
      'doc': 'DOC',
      'docx': 'DOC',
      'txt': 'TXT',
      'csv': 'CSV',
      'xlsx': 'XLS',
      'xls': 'XLS',
      'png': 'IMG',
      'jpg': 'IMG',
      'jpeg': 'IMG',
      'gif': 'IMG'
    };
    
    const type = fileType.toLowerCase();
    return iconMap[type] || 'FILE';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'uploading':
        return <CircularProgress size={16} />;
      default:
        return <InsertDriveFile fontSize="small" color="action" />;
    }
  };

  const handleFileChange = (event) => {
    const newFiles = processFiles(event.target.files);
    if (newFiles.length === 0) return;
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setMessage({ text: 'Processing files...', type: 'info' });
    handleUpload(newFiles);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    setDragOver(event.type === 'dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const newFiles = processFiles(event.dataTransfer.files);
    if (newFiles.length === 0) return;
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setMessage({ text: 'Processing files...', type: 'info' });
    handleUpload(newFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage({ text: 'Please select files to upload.', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: 'Starting upload...', type: 'info' });

    let successfulUploads = 0;
    let failedUploads = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileItem = selectedFiles[i];
      if (fileItem.status === 'completed') continue; // Skip already completed files

      const formData = new FormData();
      formData.append('files', fileItem.file);

      // Update status for the current file to uploading
      setSelectedFiles(prev => prev.map(f => 
        f.name === fileItem.name 
          ? { ...f, status: 'uploading', progress: 0 } 
          : f
      ));

      try {
        const source = axios.CancelToken.source();
        xhrRefs.current[fileItem.name] = source; // Store cancel token source

        await apiClient.post('/api/ingest/upload-documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setSelectedFiles(prev => 
                prev.map(f => 
                  f.name === fileItem.name 
                    ? { ...f, progress: percentComplete } 
                    : f
                )
              );
            }
          },
          cancelToken: source.token,
        });

        setSelectedFiles(prev => prev.map(f => 
          f.name === fileItem.name 
            ? { ...f, status: 'completed', progress: 100 } 
            : f
        ));
        successfulUploads++;

      } catch (error) {
        if (axios.isCancel(error)) {
          setMessage({ text: `Upload of ${fileItem.name} cancelled.`, type: 'error' });
        } else {
          console.error(`Upload error for ${fileItem.name}:`, error);
          setMessage({ 
            text: `Upload of ${fileItem.name} failed: ${error.response?.data?.detail || 'Unknown error'}`, 
            type: 'error' 
          });
        }
        setSelectedFiles(prev => prev.map(f => 
          f.name === fileItem.name 
            ? { ...f, status: 'error' } 
            : f
        ));
        failedUploads++;
      } finally {
        delete xhrRefs.current[fileItem.name]; // Clean up cancel token source
      }
    }

    setUploading(false);
    if (failedUploads === 0) {
      setMessage({ text: `All ${successfulUploads} files uploaded successfully!`, type: 'success' });
      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      }
      setTimeout(() => {
        setSelectedFiles([]);
        setMessage({ text: '', type: '' });
      }, 3000);
    } else if (successfulUploads > 0) {
      setMessage({ text: `${successfulUploads} files uploaded, ${failedUploads} failed.`, type: 'warning' });
    } else {
      setMessage({ text: `All ${failedUploads} files failed to upload.`, type: 'error' });
    }
  };

  const handleCancelUpload = (fileName) => {
    if (xhrRefs.current[fileName]) {
      xhrRefs.current[fileName].cancel('Upload cancelled by user.');
      delete xhrRefs.current[fileName];
      setSelectedFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { ...f, status: 'cancelled', progress: 0 } 
          : f
      ));
      setMessage({ text: `Upload of ${fileName} cancelled.`, type: 'warning' });
    }
  };
  
  // Clean up XHR refs on unmount
  useEffect(() => {
    return () => {
      // Abort any pending uploads when component unmounts
      Object.values(xhrRefs.current).forEach(source => {
        if (source) source.cancel('Component unmounted.');
      });
    };
  }, []);

  // Clean up XHR refs on unmount
useEffect(() => {
  return () => {
    // Abort any pending uploads when component unmounts
    Object.values(xhrRefs.current).forEach(source => {
      if (source) source.cancel('Component unmounted.');
    });
  };
}, []);

return (
  <Box sx={{ width: '100%' }}>
    <VisuallyHiddenInput 
      type="file" 
      multiple 
      onChange={handleFileChange} 
      ref={fileInputRef}
      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif"
    />
    <DropZone 
      elevation={0}
      isdragover={dragOver}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <CloudUpload fontSize="medium" color="action" sx={{ fontSize: '1.5rem' }} />
        <Typography variant="body2" align="center">
          Drag & drop files here, or click to select
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center">
          PDF, DOCX, TXT, CSV, XLSX, images
        </Typography>
      </Box>
    </DropZone>

    {selectedFiles.length > 0 && (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500 }}>
          Files to upload ({selectedFiles.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {selectedFiles.map((file, index) => (
            <FilePreview key={index} variant="outlined">
              <Box sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0.5,
                mr: 0.5,
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                {getFileIcon(file.type)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap variant="body2">
                  {file.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Typography variant="caption" color="textSecondary">
                    {file.size}
                  </Typography>
                  {file.status === 'uploading' && file.progress > 0 && (
                    <Typography variant="caption" color="primary">
                      {file.progress}%
                    </Typography>
                  )}
                </Box>
                {file.status === 'uploading' && (
                  <Box sx={{ width: '100%', mt: 0.5 }}>
                    <Box 
                      sx={{
                        height: 4,
                        bgcolor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}
                    >
                      <Box 
                        sx={{
                          height: '100%',
                          width: `${file.progress}%`,
                          bgcolor: 'primary.main',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getStatusIcon(file.status)}
              </Box>
            </FilePreview>
            ))}
          </Box>
        </Box>
      )}

      {message.text && (
        <Box 
          sx={{
            mt: 1.5,
            p: 1,
            borderRadius: 0.5,
            bgcolor: message.type === 'error' ? 'error.light' : 'success.light',
            color: message.type === 'error' ? 'error.contrastText' : 'success.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
              flexShrink: 0
            }
          }}
        >
          {message.type === 'error' ? <ErrorIcon /> : <CheckCircle />}
          <Typography variant="body2" sx={{ lineHeight: 1.2, fontSize: '0.8125rem' }}>
            {message.text}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DocumentUploader;

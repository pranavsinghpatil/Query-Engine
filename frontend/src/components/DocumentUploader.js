import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import { CloudUpload, InsertDriveFile, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isdragover
    ? theme.palette.action.hover
    : theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const FilePreview = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
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
  status: 'pending',
    progress: 0
}));
  };

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

const handleUpload = async (filesToUpload) => {
  setUploading(true);
  setMessage({ text: 'Uploading files...', type: 'info' });

  const formData = new FormData();
  filesToUpload.forEach(fileItem => {
    formData.append('files', fileItem.file);
  });

  try {
    await apiClient.post('/api/ingest/upload-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentComplete);
          setSelectedFiles(prev =>
            prev.map(file => ({
              ...file,
              progress: percentComplete,
              status: percentComplete === 100 ? 'completed' : 'uploading'
            }))
          );
        }
      }
    });

    // Update metrics on successful upload
    if (typeof onUploadSuccess === 'function') {
      onUploadSuccess();
    }

    setMessage({
      text: 'Files uploaded successfully!',
      type: 'success'
    });

    // Clear files after delay
    setTimeout(() => {
      setSelectedFiles([]);
      setProgress(0);
    }, 3000);

  } catch (error) {
    console.error('Upload error:', error);
    setMessage({
      text: error.response?.data?.detail || 'Upload failed. Please try again.',
      type: 'error'
    });
    setSelectedFiles(prev =>
      prev.map(file => ({
        ...file,
        status: 'error'
      }))
    );
  } finally {
    setUploading(false);
  }
};

const handleCancelUpload = () => {
  if (xhrRefs.current['all_files_upload']) {
    xhrRefs.current['all_files_upload'].abort();
    delete xhrRefs.current['all_files_upload'];
    setMessage({ text: 'Upload cancelled.', type: 'error' });
    setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'error', progress: 0 })));
  }
};

// Clean up XHR refs on unmount
useEffect(() => {
  return () => {
    // Abort any pending uploads when component unmounts
    if (xhrRefs.current['all_files_upload']) {
      xhrRefs.current['all_files_upload'].abort();
    }
  };
}, []);

return (
  <Box sx={{ width: '100%' }}>
    <Typography variant="h6" gutterBottom>
      Upload Documents
    </Typography>

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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <CloudUpload fontSize="large" color="action" />
        <Typography variant="body1">
          Drag & drop files here, or click to select
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Supports PDF, DOCX, TXT, CSV, XLSX, and images
        </Typography>
      </Box>
    </DropZone>

    {selectedFiles.length > 0 && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Files to upload ({selectedFiles.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {selectedFiles.map((file, index) => (
            <FilePreview key={index} variant="outlined">
              <Box sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                mr: 1.5,
                flexShrink: 0
              }}>
                {getFileIcon(file.type)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap variant="body2">
                  {file.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="textSecondary">
                    {file.size}
                  </Typography>
                  {file.status === 'uploading' && progress > 0 && (
                    <Typography variant="caption" color="primary">
                      {progress}%
                    </Typography>
                  )}
                </Box>
                {file.status === 'uploading' && (
                  <Box sx={{ width: '100%', mt: 1 }}>
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
                          width: `${progress}%`,
                          bgcolor: 'primary.main',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {file.status === 'uploading' && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelUpload(); // Cancel the single ongoing upload
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <ErrorIcon fontSize="small" color="error" />
                  </IconButton>
                )}
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
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: message.type === 'error' ? 'error.light' : 'success.light',
          color: message.type === 'error' ? 'error.contrastText' : 'success.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {message.type === 'error' ? <ErrorIcon /> : <CheckCircle />}
        <Typography variant="body2">
          {message.text}
        </Typography>
      </Box>
    )}
  </Box>
);
}

export default DocumentUploader;

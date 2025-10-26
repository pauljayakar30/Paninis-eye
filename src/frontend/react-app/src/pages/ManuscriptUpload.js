import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Image,
  Delete,
  Visibility,
  Settings,
  AutoFixHigh,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { uploadManuscript, setImage, clearImage } from '../store/slices/manuscriptSlice';

const ManuscriptUpload = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isUploading, error, uploadHistory } = useSelector(state => state.manuscript);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Store in Redux
      dispatch(setImage({ file, url }));
      
      toast.success('Image loaded successfully!');
    }
  }, [dispatch]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });
  
  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }
    
    try {
      const result = await dispatch(uploadManuscript(selectedFile)).unwrap();
      toast.success('Upload completed! Processing OCR...');
      
      // Navigate to workspace
      navigate(`/workspace/${result.id}`);
    } catch (error) {
      toast.error(`Upload failed: ${error.message || error}`);
    }
  };
  
  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    dispatch(clearImage());
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Upload Sanskrit Manuscript
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload a high-quality image of your Sanskrit manuscript for AI-powered reconstruction
        </Typography>
      </Box>
      
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              {error.message || error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} md={8}>
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            <input {...getInputProps()} />
            
            {!selectedFile ? (
              <Box>
                <CloudUpload
                  sx={{
                    fontSize: 64,
                    color: 'primary.main',
                    mb: 2,
                  }}
                />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop the image here' : 'Drag & drop manuscript image'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports: PNG, JPG, JPEG, TIFF, BMP (max 50MB)
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Manuscript preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    borderRadius: 2,
                    boxShadow: 2,
                    mb: 2,
                  }}
                />
                <Typography variant="h6" gutterBottom>
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoFixHigh />}
                    onClick={handleUpload}
                    disabled={isUploading}
                    size="large"
                  >
                    {isUploading ? 'Processing...' : 'Start Reconstruction'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={handleClear}
                    disabled={isUploading}
                  >
                    Clear
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
          
          {/* Progress */}
          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Uploading and processing image...
              </Typography>
            </Box>
          )}
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Upload Guidelines */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Upload Guidelines
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  ✅ High resolution (300+ DPI recommended)
                </Typography>
                <Typography variant="body2">
                  ✅ Clear, well-lit images
                </Typography>
                <Typography variant="body2">
                  ✅ Minimal shadows and reflections
                </Typography>
                <Typography variant="body2">
                  ✅ Sanskrit text in Devanagari script
                </Typography>
                <Typography variant="body2">
                  ⚠️ Avoid blurry or distorted images
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          {/* AI Features */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🧠 AI Processing Features
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  icon={<Image />}
                  label="Multi-Engine OCR"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<AutoFixHigh />}
                  label="Damage Detection"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Settings />}
                  label="Unicode Normalization"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Visibility />}
                  label="Confidence Scoring"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
          
          {/* Recent Uploads */}
          {uploadHistory.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📚 Recent Uploads
                </Typography>
                
                {uploadHistory.slice(0, 3).map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1,
                      borderBottom: index < 2 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" noWrap>
                        {item.preview}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Tooltip title="Open workspace">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/workspace/${item.sessionId}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManuscriptUpload;
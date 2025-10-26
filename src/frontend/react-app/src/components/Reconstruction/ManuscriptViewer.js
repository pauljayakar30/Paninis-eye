import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Layers,
  Visibility,
  VisibilityOff,
  Tune,
  BrushOutlined,
  AutoFixHigh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  setZoomLevel, 
  setImagePosition, 
  toggleMask,
  setSelectedMasks,
} from '../../store/slices/manuscriptSlice';

const ManuscriptViewer = ({ 
  showUncertainty = true, 
  realtimeMode = false,
  onMaskSelectionChange 
}) => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Redux state
  const {
    imageUrl,
    masks,
    selectedMasks,
    zoomLevel,
    imagePosition,
    tokens,
  } = useSelector(state => state.manuscript);
  
  const {
    uncertaintyScores,
    visualAttention,
  } = useSelector(state => state.reconstruction);
  
  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredMask, setHoveredMask] = useState(null);
  const [showMasks, setShowMasks] = useState(true);
  const [showTokens, setShowTokens] = useState(false);
  const [showAttention, setShowAttention] = useState(false);
  const [showUncertaintyLocal, setShowUncertainty] = useState(showUncertainty);
  const [brushMode, setBrushMode] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  
  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Handle zoom
  const handleZoom = useCallback((delta, centerX, centerY) => {
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
    dispatch(setZoomLevel(newZoom));
    
    // Adjust position to zoom towards center point
    if (centerX !== undefined && centerY !== undefined) {
      const zoomFactor = newZoom / zoomLevel;
      const newX = centerX - (centerX - imagePosition.x) * zoomFactor;
      const newY = centerY - (centerY - imagePosition.y) * zoomFactor;
      dispatch(setImagePosition({ x: newX, y: newY }));
    }
  }, [dispatch, zoomLevel, imagePosition]);
  
  // Handle wheel zoom
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    const delta = -event.deltaY * 0.001;
    handleZoom(delta, centerX, centerY);
  }, [handleZoom]);
  
  // Handle mouse events for panning
  const handleMouseDown = useCallback((event) => {
    if (brushMode) return;
    
    setIsDragging(true);
    setDragStart({
      x: event.clientX - imagePosition.x,
      y: event.clientY - imagePosition.y,
    });
  }, [imagePosition, brushMode]);
  
  const handleMouseMove = useCallback((event) => {
    if (!isDragging || brushMode) return;
    
    const newX = event.clientX - dragStart.x;
    const newY = event.clientY - dragStart.y;
    dispatch(setImagePosition({ x: newX, y: newY }));
  }, [isDragging, dragStart, dispatch, brushMode]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle mask selection
  const handleMaskClick = useCallback((maskId, event) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      dispatch(toggleMask(maskId));
    } else {
      // Single select
      const newSelection = selectedMasks.includes(maskId) ? [] : [maskId];
      dispatch(setSelectedMasks(newSelection));
    }
    
    if (onMaskSelectionChange) {
      const newMasks = selectedMasks.includes(maskId) 
        ? selectedMasks.filter(id => id !== maskId)
        : [...selectedMasks, maskId];
      onMaskSelectionChange(newMasks);
    }
  }, [dispatch, selectedMasks, onMaskSelectionChange]);
  
  // Center image
  const centerImage = useCallback(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = (containerRect.width - imageDimensions.width * zoomLevel) / 2;
      const centerY = (containerRect.height - imageDimensions.height * zoomLevel) / 2;
      dispatch(setImagePosition({ x: centerX, y: centerY }));
    }
  }, [dispatch, imageDimensions, zoomLevel]);
  
  // Fit to container
  const fitToContainer = useCallback(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scaleX = containerRect.width / imageDimensions.width;
      const scaleY = containerRect.height / imageDimensions.height;
      const newZoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding
      
      dispatch(setZoomLevel(newZoom));
      centerImage();
    }
  }, [dispatch, imageDimensions, centerImage]);
  
  // Load image and get dimensions
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);
  
  // Auto-fit on first load
  useEffect(() => {
    if (imageDimensions.width > 0 && zoomLevel === 1) {
      setTimeout(fitToContainer, 100);
    }
  }, [imageDimensions, fitToContainer, zoomLevel]);
  
  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);
  
  // Render mask overlay
  const renderMask = (mask, index) => {
    const isSelected = selectedMasks.includes(mask.mask_id);
    const isHovered = hoveredMask === mask.mask_id;
    const uncertainty = uncertaintyScores[mask.mask_id];
    
    const style = {
      position: 'absolute',
      left: mask.bbox[0] * zoomLevel,
      top: mask.bbox[1] * zoomLevel,
      width: mask.bbox[2] * zoomLevel,
      height: mask.bbox[3] * zoomLevel,
      border: `2px solid ${isSelected ? '#FF6B35' : '#8B4513'}`,
      backgroundColor: isSelected 
        ? 'rgba(255, 107, 53, 0.2)' 
        : 'rgba(139, 69, 19, 0.1)',
      cursor: 'pointer',
      borderRadius: 4,
      transition: 'all 0.2s ease-in-out',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      zIndex: isSelected ? 10 : 5,
    };
    
    // Add uncertainty visualization
    if (showUncertainty && uncertainty) {
      const opacity = 1 - (uncertainty.confidence || 0);
      style.boxShadow = `inset 0 0 20px rgba(255, 0, 0, ${opacity})`;
    }
    
    return (
      <motion.div
        key={mask.mask_id}
        style={style}
        onClick={(e) => handleMaskClick(mask.mask_id, e)}
        onMouseEnter={() => setHoveredMask(mask.mask_id)}
        onMouseLeave={() => setHoveredMask(null)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Mask label */}
        <Chip
          label={`${index + 1}`}
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            left: -2,
            fontSize: '0.7rem',
            height: 20,
            backgroundColor: isSelected ? '#FF6B35' : '#8B4513',
            color: 'white',
          }}
        />
        
        {/* Uncertainty indicator */}
        {showUncertainty && uncertainty && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -8,
              right: -8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: uncertainty.confidence > 0.8 ? '#4CAF50' : 
                             uncertainty.confidence > 0.5 ? '#FF9800' : '#F44336',
              border: '2px solid white',
              fontSize: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {Math.round((uncertainty.confidence || 0) * 100)}
          </Box>
        )}
      </motion.div>
    );
  };
  
  // Render attention heatmap
  const renderAttentionHeatmap = () => {
    if (!showAttention || !visualAttention) return null;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${visualAttention.x}% ${visualAttention.y}%, 
                      rgba(255, 107, 53, 0.3) 0%, 
                      rgba(255, 107, 53, 0.1) 30%, 
                      transparent 60%)`,
          borderRadius: 4,
        }}
      />
    );
  };
  
  if (!imageUrl) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography>No manuscript image loaded</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Zoom controls */}
        <Tooltip title="Zoom in">
          <IconButton onClick={() => handleZoom(0.2)} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom out">
          <IconButton onClick={() => handleZoom(-0.2)} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        
        <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'center' }}>
          {Math.round(zoomLevel * 100)}%
        </Typography>
        
        <Divider orientation="vertical" flexItem />
        
        {/* View controls */}
        <Tooltip title="Center image">
          <IconButton onClick={centerImage} size="small">
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Fit to container">
          <IconButton onClick={fitToContainer} size="small">
            <Layers />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Layer toggles */}
        <Tooltip title="Toggle masks">
          <IconButton 
            onClick={() => setShowMasks(!showMasks)} 
            size="small"
            color={showMasks ? 'primary' : 'default'}
          >
            {showMasks ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Toggle attention">
          <IconButton 
            onClick={() => setShowAttention(!showAttention)} 
            size="small"
            color={showAttention ? 'primary' : 'default'}
          >
            <AutoFixHigh />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Brush mode">
          <IconButton 
            onClick={() => setBrushMode(!brushMode)} 
            size="small"
            color={brushMode ? 'primary' : 'default'}
          >
            <BrushOutlined />
          </IconButton>
        </Tooltip>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Settings */}
        <Tooltip title="View settings">
          <IconButton 
            onClick={(e) => setSettingsAnchor(e.currentTarget)} 
            size="small"
          >
            <Tune />
          </IconButton>
        </Tooltip>
        
        {/* Selection info */}
        {selectedMasks.length > 0 && (
          <Chip
            label={`${selectedMasks.length} selected`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      
      {/* Viewer container */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : brushMode ? 'crosshair' : 'grab',
          backgroundColor: '#f5f5f5',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Main image */}
        <Box
          component="img"
          src={imageUrl}
          alt="Manuscript"
          sx={{
            position: 'absolute',
            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        
        {/* Mask overlays */}
        <AnimatePresence>
          {showMasks && masks.map((mask, index) => (
            <Box
              key={mask.mask_id}
              sx={{
                position: 'absolute',
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transformOrigin: '0 0',
              }}
            >
              {renderMask(mask, index)}
            </Box>
          ))}
        </AnimatePresence>
        
        {/* Attention heatmap */}
        {renderAttentionHeatmap()}
        
        {/* Hover info */}
        <AnimatePresence>
          {hoveredMask && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 1000,
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  Mask: {hoveredMask}
                </Typography>
                {uncertaintyScores[hoveredMask] && (
                  <Typography variant="caption">
                    Confidence: {Math.round(uncertaintyScores[hoveredMask].confidence * 100)}%
                  </Typography>
                )}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
      
      {/* Settings menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showUncertaintyLocal}
                onChange={(e) => setShowUncertainty(e.target.checked)}
              />
            }
            label="Show Uncertainty"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showTokens}
                onChange={(e) => setShowTokens(e.target.checked)}
              />
            }
            label="Show Tokens"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showAttention}
                onChange={(e) => setShowAttention(e.target.checked)}
              />
            }
            label="Show Attention"
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ManuscriptViewer;
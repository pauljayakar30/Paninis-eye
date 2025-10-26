import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { manuscriptAPI } from '../../services/api';

// Async thunks for API calls
export const uploadManuscript = createAsyncThunk(
  'manuscript/upload',
  async (file, { rejectWithValue }) => {
    try {
      const response = await manuscriptAPI.upload(file);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const performOCR = createAsyncThunk(
  'manuscript/ocr',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await manuscriptAPI.performOCR(sessionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const manuscriptSlice = createSlice({
  name: 'manuscript',
  initialState: {
    // Current session
    sessionId: null,
    image: null,
    imageUrl: null,
    
    // OCR results
    ocrText: '',
    ocrPreview: '',
    tokens: [],
    masks: [],
    confidence: 0,
    
    // Processing state
    isUploading: false,
    isProcessingOCR: false,
    
    // UI state
    selectedMasks: [],
    zoomLevel: 1,
    imagePosition: { x: 0, y: 0 },
    
    // History
    uploadHistory: [],
    
    // Error handling
    error: null,
    
    // Advanced features
    damageAnalysis: null,
    qualityMetrics: null,
    preprocessingOptions: {
      denoise: true,
      enhance: true,
      binarize: true,
    },
  },
  reducers: {
    setImage: (state, action) => {
      state.image = action.payload.file;
      state.imageUrl = action.payload.url;
    },
    
    clearImage: (state) => {
      state.image = null;
      state.imageUrl = null;
      state.sessionId = null;
      state.ocrText = '';
      state.tokens = [];
      state.masks = [];
    },
    
    setSelectedMasks: (state, action) => {
      state.selectedMasks = action.payload;
    },
    
    toggleMask: (state, action) => {
      const maskId = action.payload;
      const index = state.selectedMasks.indexOf(maskId);
      if (index > -1) {
        state.selectedMasks.splice(index, 1);
      } else {
        state.selectedMasks.push(maskId);
      }
    },
    
    setZoomLevel: (state, action) => {
      state.zoomLevel = Math.max(0.1, Math.min(5, action.payload));
    },
    
    setImagePosition: (state, action) => {
      state.imagePosition = action.payload;
    },
    
    updatePreprocessingOptions: (state, action) => {
      state.preprocessingOptions = {
        ...state.preprocessingOptions,
        ...action.payload,
      };
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    addToHistory: (state, action) => {
      state.uploadHistory.unshift({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 10 items
      if (state.uploadHistory.length > 10) {
        state.uploadHistory = state.uploadHistory.slice(0, 10);
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Upload manuscript
      .addCase(uploadManuscript.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadManuscript.fulfilled, (state, action) => {
        state.isUploading = false;
        state.sessionId = action.payload.id;
        state.ocrPreview = action.payload.ocr_text_preview;
        state.masks = action.payload.masks || [];
        state.tokens = action.payload.tokens || [];
        
        // Add to history
        state.uploadHistory.unshift({
          sessionId: action.payload.id,
          preview: action.payload.ocr_text_preview,
          timestamp: new Date().toISOString(),
          masksCount: action.payload.masks?.length || 0,
        });
      })
      .addCase(uploadManuscript.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload;
      })
      
      // Perform OCR
      .addCase(performOCR.pending, (state) => {
        state.isProcessingOCR = true;
        state.error = null;
      })
      .addCase(performOCR.fulfilled, (state, action) => {
        state.isProcessingOCR = false;
        state.ocrText = action.payload.text;
        state.tokens = action.payload.tokens || [];
        state.masks = action.payload.masks || [];
        state.confidence = action.payload.confidence || 0;
        state.damageAnalysis = action.payload.damage_analysis;
        state.qualityMetrics = action.payload.quality_metrics;
      })
      .addCase(performOCR.rejected, (state, action) => {
        state.isProcessingOCR = false;
        state.error = action.payload;
      });
  },
});

export const {
  setImage,
  clearImage,
  setSelectedMasks,
  toggleMask,
  setZoomLevel,
  setImagePosition,
  updatePreprocessingOptions,
  clearError,
  addToHistory,
} = manuscriptSlice.actions;

export default manuscriptSlice.reducer;
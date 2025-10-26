import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reconstructionAPI } from '../../services/api';

// Async thunks for intelligent reconstruction
export const reconstructText = createAsyncThunk(
  'reconstruction/reconstruct',
  async ({ sessionId, maskIds, mode, nCandidates }, { rejectWithValue }) => {
    try {
      const response = await reconstructionAPI.reconstruct({
        image_id: sessionId,
        mask_ids: maskIds,
        mode,
        n_candidates: nCandidates,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const translateText = createAsyncThunk(
  'reconstruction/translate',
  async ({ text, style }, { rejectWithValue }) => {
    try {
      const response = await reconstructionAPI.translate({
        sanskrit_text: text,
        style,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const explainReconstruction = createAsyncThunk(
  'reconstruction/explain',
  async ({ originalText, reconstructedText, context }, { rejectWithValue }) => {
    try {
      const response = await reconstructionAPI.explain({
        original_text: originalText,
        reconstructed_text: reconstructedText,
        context,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const reconstructionSlice = createSlice({
  name: 'reconstruction',
  initialState: {
    // Current reconstruction
    candidates: [],
    selectedCandidate: null,
    
    // Translation results
    translations: {},
    
    // Processing state
    isReconstructing: false,
    isTranslating: false,
    isExplaining: false,
    
    // Advanced AI features
    uncertaintyScores: {},
    confidenceMetrics: {},
    grammarCompliance: {},
    
    // User interactions
    userCorrections: [],
    acceptedCandidates: [],
    rejectedCandidates: [],
    
    // Reconstruction settings
    settings: {
      mode: 'hard', // 'soft' | 'hard'
      nCandidates: 5,
      temperature: 0.8,
      useConstraints: true,
      enableUncertainty: true,
      enableMemory: true,
    },
    
    // Real-time features
    livePreview: null,
    streamingResults: [],
    
    // Performance metrics
    timings: {},
    
    // Error handling
    error: null,
    
    // Explanation and reasoning
    explanations: {},
    grammarRules: [],
    
    // Context and memory
    episodicMemory: [],
    contextHistory: [],
    
    // Multi-modal features
    imageContext: null,
    visualAttention: null,
  },
  
  reducers: {
    setSelectedCandidate: (state, action) => {
      state.selectedCandidate = action.payload;
    },
    
    acceptCandidate: (state, action) => {
      const candidate = action.payload;
      state.acceptedCandidates.push({
        ...candidate,
        timestamp: new Date().toISOString(),
      });
      
      // Remove from rejected if present
      state.rejectedCandidates = state.rejectedCandidates.filter(
        c => c.candidate_id !== candidate.candidate_id
      );
    },
    
    rejectCandidate: (state, action) => {
      const candidate = action.payload;
      state.rejectedCandidates.push({
        ...candidate,
        timestamp: new Date().toISOString(),
      });
      
      // Remove from accepted if present
      state.acceptedCandidates = state.acceptedCandidates.filter(
        c => c.candidate_id !== candidate.candidate_id
      );
    },
    
    addUserCorrection: (state, action) => {
      state.userCorrections.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    
    setLivePreview: (state, action) => {
      state.livePreview = action.payload;
    },
    
    addStreamingResult: (state, action) => {
      state.streamingResults.push(action.payload);
    },
    
    clearStreamingResults: (state) => {
      state.streamingResults = [];
    },
    
    setImageContext: (state, action) => {
      state.imageContext = action.payload;
    },
    
    setVisualAttention: (state, action) => {
      state.visualAttention = action.payload;
    },
    
    addToEpisodicMemory: (state, action) => {
      state.episodicMemory.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 100 memories
      if (state.episodicMemory.length > 100) {
        state.episodicMemory = state.episodicMemory.slice(-100);
      }
    },
    
    updateContextHistory: (state, action) => {
      state.contextHistory.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 50 context entries
      if (state.contextHistory.length > 50) {
        state.contextHistory = state.contextHistory.slice(-50);
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetReconstruction: (state) => {
      state.candidates = [];
      state.selectedCandidate = null;
      state.translations = {};
      state.explanations = {};
      state.streamingResults = [];
      state.livePreview = null;
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Reconstruct text
      .addCase(reconstructText.pending, (state) => {
        state.isReconstructing = true;
        state.error = null;
        state.candidates = [];
      })
      .addCase(reconstructText.fulfilled, (state, action) => {
        state.isReconstructing = false;
        state.candidates = action.payload.candidates || [];
        state.timings = action.payload.timings || {};
        
        // Extract advanced AI features
        state.candidates.forEach(candidate => {
          if (candidate.uncertainty_scores) {
            state.uncertaintyScores[candidate.candidate_id] = candidate.uncertainty_scores;
          }
          if (candidate.confidence_metrics) {
            state.confidenceMetrics[candidate.candidate_id] = candidate.confidence_metrics;
          }
          if (candidate.grammar_compliance) {
            state.grammarCompliance[candidate.candidate_id] = candidate.grammar_compliance;
          }
        });
        
        // Auto-select best candidate
        if (state.candidates.length > 0) {
          const bestCandidate = state.candidates.reduce((best, current) => 
            (current.scores?.combined || 0) > (best.scores?.combined || 0) ? current : best
          );
          state.selectedCandidate = bestCandidate;
        }
      })
      .addCase(reconstructText.rejected, (state, action) => {
        state.isReconstructing = false;
        state.error = action.payload;
      })
      
      // Translate text
      .addCase(translateText.pending, (state) => {
        state.isTranslating = true;
      })
      .addCase(translateText.fulfilled, (state, action) => {
        state.isTranslating = false;
        const { text, style } = action.meta.arg;
        const key = `${text}_${style}`;
        state.translations[key] = action.payload;
      })
      .addCase(translateText.rejected, (state, action) => {
        state.isTranslating = false;
        state.error = action.payload;
      })
      
      // Explain reconstruction
      .addCase(explainReconstruction.pending, (state) => {
        state.isExplaining = true;
      })
      .addCase(explainReconstruction.fulfilled, (state, action) => {
        state.isExplaining = false;
        const { originalText, reconstructedText } = action.meta.arg;
        const key = `${originalText}_${reconstructedText}`;
        state.explanations[key] = action.payload;
      })
      .addCase(explainReconstruction.rejected, (state, action) => {
        state.isExplaining = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedCandidate,
  acceptCandidate,
  rejectCandidate,
  addUserCorrection,
  updateSettings,
  setLivePreview,
  addStreamingResult,
  clearStreamingResults,
  setImageContext,
  setVisualAttention,
  addToEpisodicMemory,
  updateContextHistory,
  clearError,
  resetReconstruction,
} = reconstructionSlice.actions;

export default reconstructionSlice.reducer;
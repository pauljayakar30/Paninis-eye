import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { assistantAPI } from '../../services/api';

// Async thunks
export const queryAssistant = createAsyncThunk(
  'assistant/query',
  async ({ query, context }, { rejectWithValue }) => {
    try {
      const response = await assistantAPI.query({ query, context });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getConversationHistory = createAsyncThunk(
  'assistant/getHistory',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await assistantAPI.getHistory(sessionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const assistantSlice = createSlice({
  name: 'assistant',
  initialState: {
    // Conversation state
    messages: [],
    isTyping: false,
    
    // Current query
    currentQuery: '',
    isProcessing: false,
    
    // Suggestions
    suggestions: [],
    
    // Context
    context: {},
    
    // Settings
    settings: {
      autoSuggest: true,
      showSources: true,
      enableVoice: false,
    },
    
    // Error handling
    error: null,
  },
  
  reducers: {
    addMessage: (state, action) => {
      state.messages.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },
    
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    
    updateContext: (state, action) => {
      state.context = {
        ...state.context,
        ...action.payload,
      };
    },
    
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    
    clearConversation: (state) => {
      state.messages = [];
      state.currentQuery = '';
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Query assistant
      .addCase(queryAssistant.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(queryAssistant.fulfilled, (state, action) => {
        state.isProcessing = false;
        
        // Add assistant response
        state.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: action.payload.answer,
          sources: action.payload.sources || [],
          actions: action.payload.actions || [],
          timestamp: new Date().toISOString(),
        });
        
        // Clear current query
        state.currentQuery = '';
      })
      .addCase(queryAssistant.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Get conversation history
      .addCase(getConversationHistory.fulfilled, (state, action) => {
        state.messages = action.payload.messages || [];
      });
  },
});

export const {
  addMessage,
  setCurrentQuery,
  setIsTyping,
  setSuggestions,
  updateContext,
  updateSettings,
  clearConversation,
  clearError,
} = assistantSlice.actions;

export default assistantSlice.reducer;
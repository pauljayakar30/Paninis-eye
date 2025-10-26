import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { knowledgeGraphAPI } from '../../services/api';

// Async thunks
export const searchKnowledgeGraph = createAsyncThunk(
  'knowledgeGraph/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphAPI.search(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getNodeDetails = createAsyncThunk(
  'knowledgeGraph/getNode',
  async (nodeId, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphAPI.getNode(nodeId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getRelatedNodes = createAsyncThunk(
  'knowledgeGraph/getRelated',
  async ({ nodeId, relationTypes }, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphAPI.getRelated(nodeId, relationTypes);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getGraphVisualization = createAsyncThunk(
  'knowledgeGraph/getVisualization',
  async ({ centerNode, depth }, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphAPI.getGraphData(centerNode, depth);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const knowledgeGraphSlice = createSlice({
  name: 'knowledgeGraph',
  initialState: {
    // Graph data
    nodes: [],
    relationships: [],
    
    // Search
    searchResults: [],
    searchQuery: '',
    isSearching: false,
    
    // Selected node
    selectedNode: null,
    nodeDetails: null,
    relatedNodes: [],
    
    // Visualization
    visualizationData: null,
    isLoadingVisualization: false,
    
    // Filters
    activeFilters: {
      nodeTypes: ['all'],
      relationTypes: ['all'],
      timeRange: 'all',
    },
    
    // UI state
    viewMode: 'graph', // 'graph', 'list', 'table'
    zoomLevel: 1,
    centerPosition: { x: 0, y: 0 },
    
    // Statistics
    stats: {
      totalNodes: 0,
      totalRelationships: 0,
      nodeTypeCounts: {},
    },
    
    // Error handling
    error: null,
  },
  
  reducers: {
    setSelectedNode: (state, action) => {
      state.selectedNode = action.payload;
    },
    
    clearSelectedNode: (state) => {
      state.selectedNode = null;
      state.nodeDetails = null;
      state.relatedNodes = [];
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    
    updateFilters: (state, action) => {
      state.activeFilters = {
        ...state.activeFilters,
        ...action.payload,
      };
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setZoomLevel: (state, action) => {
      state.zoomLevel = Math.max(0.1, Math.min(5, action.payload));
    },
    
    setCenterPosition: (state, action) => {
      state.centerPosition = action.payload;
    },
    
    addNode: (state, action) => {
      const existingIndex = state.nodes.findIndex(node => node.id === action.payload.id);
      if (existingIndex >= 0) {
        state.nodes[existingIndex] = action.payload;
      } else {
        state.nodes.push(action.payload);
      }
    },
    
    removeNode: (state, action) => {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
      state.relationships = state.relationships.filter(
        rel => rel.source !== action.payload && rel.target !== action.payload
      );
    },
    
    addRelationship: (state, action) => {
      const existingIndex = state.relationships.findIndex(
        rel => rel.source === action.payload.source && 
               rel.target === action.payload.target &&
               rel.type === action.payload.type
      );
      if (existingIndex === -1) {
        state.relationships.push(action.payload);
      }
    },
    
    updateStats: (state, action) => {
      state.stats = {
        ...state.stats,
        ...action.payload,
      };
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Search knowledge graph
      .addCase(searchKnowledgeGraph.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchKnowledgeGraph.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.results || [];
      })
      .addCase(searchKnowledgeGraph.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload;
      })
      
      // Get node details
      .addCase(getNodeDetails.fulfilled, (state, action) => {
        state.nodeDetails = action.payload;
      })
      .addCase(getNodeDetails.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get related nodes
      .addCase(getRelatedNodes.fulfilled, (state, action) => {
        state.relatedNodes = action.payload.nodes || [];
      })
      .addCase(getRelatedNodes.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get graph visualization
      .addCase(getGraphVisualization.pending, (state) => {
        state.isLoadingVisualization = true;
        state.error = null;
      })
      .addCase(getGraphVisualization.fulfilled, (state, action) => {
        state.isLoadingVisualization = false;
        state.visualizationData = action.payload;
        state.nodes = action.payload.nodes || [];
        state.relationships = action.payload.relationships || [];
      })
      .addCase(getGraphVisualization.rejected, (state, action) => {
        state.isLoadingVisualization = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedNode,
  clearSelectedNode,
  setSearchQuery,
  clearSearchResults,
  updateFilters,
  setViewMode,
  setZoomLevel,
  setCenterPosition,
  addNode,
  removeNode,
  addRelationship,
  updateStats,
  clearError,
} = knowledgeGraphSlice.actions;

export default knowledgeGraphSlice.reducer;
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Manuscript API
export const manuscriptAPI = {
  // Upload manuscript image
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Perform OCR on uploaded image
  performOCR: async (sessionId) => {
    return api.post('/ocr', { session_id: sessionId });
  },
  
  // Get session data
  getSession: async (sessionId) => {
    return api.get(`/session/${sessionId}`);
  },
  
  // Update preprocessing options
  updatePreprocessing: async (sessionId, options) => {
    return api.post(`/session/${sessionId}/preprocessing`, options);
  },
};

// Reconstruction API
export const reconstructionAPI = {
  // Reconstruct damaged text
  reconstruct: async (data) => {
    return api.post('/reconstruct', data);
  },
  
  // Translate Sanskrit text
  translate: async (data) => {
    return api.post('/translate', data);
  },
  
  // Explain reconstruction
  explain: async (data) => {
    return api.post('/explain', data);
  },
  
  // Get reconstruction history
  getHistory: async (sessionId) => {
    return api.get(`/reconstruction/history/${sessionId}`);
  },
  
  // Save user correction
  saveCorrection: async (data) => {
    return api.post('/reconstruction/correction', data);
  },
  
  // Adapt model to user feedback
  adaptModel: async (sessionId, corrections) => {
    return api.post(`/reconstruction/adapt/${sessionId}`, { corrections });
  },
};

// Assistant API
export const assistantAPI = {
  // Query the assistant
  query: async (data) => {
    return api.post('/assistant/query', data);
  },
  
  // Get conversation history
  getHistory: async (sessionId) => {
    return api.get(`/assistant/history/${sessionId}`);
  },
  
  // Clear conversation
  clearConversation: async (sessionId) => {
    return api.delete(`/assistant/conversation/${sessionId}`);
  },
  
  // Get suggested questions
  getSuggestions: async (context) => {
    return api.post('/assistant/suggestions', { context });
  },
};

// Knowledge Graph API
export const knowledgeGraphAPI = {
  // Search KG
  search: async (query) => {
    return api.get('/kg/search', { params: { q: query } });
  },
  
  // Get node details
  getNode: async (nodeId) => {
    return api.get(`/kg/node/${nodeId}`);
  },
  
  // Get related nodes
  getRelated: async (nodeId, relationTypes = []) => {
    return api.get(`/kg/node/${nodeId}/related`, {
      params: { types: relationTypes.join(',') }
    });
  },
  
  // Get graph visualization data
  getGraphData: async (centerNode, depth = 2) => {
    return api.get('/kg/graph', {
      params: { center: centerNode, depth }
    });
  },
  
  // Get sutras
  getSutras: async (filters = {}) => {
    return api.get('/kg/sutras', { params: filters });
  },
  
  // Get morphology rules
  getMorphologyRules: async (filters = {}) => {
    return api.get('/kg/morphology', { params: filters });
  },
};

// Analytics API
export const analyticsAPI = {
  // Get performance metrics
  getMetrics: async (sessionId, timeRange = '1h') => {
    return api.get(`/analytics/metrics/${sessionId}`, {
      params: { range: timeRange }
    });
  },
  
  // Get accuracy statistics
  getAccuracy: async (filters = {}) => {
    return api.get('/analytics/accuracy', { params: filters });
  },
  
  // Get usage statistics
  getUsage: async (timeRange = '7d') => {
    return api.get('/analytics/usage', {
      params: { range: timeRange }
    });
  },
  
  // Get model performance
  getModelPerformance: async (modelVersion) => {
    return api.get(`/analytics/model/${modelVersion}`);
  },
};

// Export API
export const exportAPI = {
  // Export reconstruction results
  exportResults: async (sessionId, format = 'json') => {
    return api.get(`/export/${sessionId}`, {
      params: { format },
      responseType: 'blob',
    });
  },
  
  // Export knowledge graph
  exportKG: async (format = 'json', filters = {}) => {
    return api.get('/export/kg', {
      params: { format, ...filters },
      responseType: 'blob',
    });
  },
  
  // Generate report
  generateReport: async (sessionId, options = {}) => {
    return api.post(`/export/report/${sessionId}`, options, {
      responseType: 'blob',
    });
  },
};

// Settings API
export const settingsAPI = {
  // Get user settings
  getSettings: async () => {
    return api.get('/settings');
  },
  
  // Update user settings
  updateSettings: async (settings) => {
    return api.put('/settings', settings);
  },
  
  // Get model settings
  getModelSettings: async () => {
    return api.get('/settings/model');
  },
  
  // Update model settings
  updateModelSettings: async (settings) => {
    return api.put('/settings/model', settings);
  },
};

// Health check
export const healthAPI = {
  // Check API health
  check: async () => {
    return api.get('/health');
  },
  
  // Check service status
  getStatus: async () => {
    return api.get('/status');
  },
};

// WebSocket connection for real-time features
export const createWebSocketConnection = (sessionId) => {
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
  const ws = new WebSocket(`${wsUrl}/ws/${sessionId}`);
  
  return ws;
};

export default api;
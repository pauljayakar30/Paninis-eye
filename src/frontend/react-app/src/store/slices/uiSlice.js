import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Layout
    sidebarOpen: true,
    theme: 'light',
    
    // Loading states
    globalLoading: false,
    loadingMessage: '',
    
    // Notifications
    notifications: [],
    
    // Modals and dialogs
    activeModal: null,
    modalData: null,
    
    // Workspace layout
    workspaceLayout: 'split', // 'split', 'focus', 'analysis'
    
    // Preferences
    preferences: {
      autoSave: true,
      showTooltips: true,
      enableAnimations: true,
      compactMode: false,
    },
  },
  
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },
    
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    
    setWorkspaceLayout: (state, action) => {
      state.workspaceLayout = action.payload;
    },
    
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  setWorkspaceLayout,
  updatePreferences,
} = uiSlice.actions;

export default uiSlice.reducer;
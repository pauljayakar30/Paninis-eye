import { configureStore } from '@reduxjs/toolkit';
import manuscriptReducer from './slices/manuscriptSlice';
import reconstructionReducer from './slices/reconstructionSlice';
import assistantReducer from './slices/assistantSlice';
import knowledgeGraphReducer from './slices/knowledgeGraphSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    manuscript: manuscriptReducer,
    reconstruction: reconstructionReducer,
    assistant: assistantReducer,
    knowledgeGraph: knowledgeGraphReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['manuscript/setImage', 'reconstruction/setImageContext'],
        ignoredPaths: ['manuscript.image', 'reconstruction.imageContext'],
      },
    }),
});
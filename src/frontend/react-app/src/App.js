import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/700.css';
import '@fontsource/noto-sans-telugu/400.css';
import '@fontsource/noto-sans-tamil/400.css';
import '@fontsource/merriweather/400.css';

import { store } from './store/store';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ManuscriptUpload from './pages/ManuscriptUpload';
import ReconstructionWorkspace from './pages/ReconstructionWorkspace';
import KnowledgeGraph from './pages/KnowledgeGraph';
import AssistantChat from './pages/AssistantChat';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import GeminiRestoration from './pages/GeminiRestoration';
import GeminiTextTest from './components/GeminiTextTest';
import TTSDemo from './components/TTSDemo';
import WebSocketProvider from './providers/WebSocketProvider';

// Advanced theme with Sanskrit-inspired colors
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B4513', // Sanskrit brown
      light: '#CD853F',
      dark: '#654321',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B35', // Saffron
      light: '#FF8A65',
      dark: '#E64A19',
    },
    background: {
      default: '#FFF8E7', // Parchment
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E2E2E',
      secondary: '#5D4E37',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F44336',
    },
    info: {
      main: '#2196F3',
    },
  },
  typography: {
    fontFamily: '"Noto Sans Devanagari", "Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#8B4513',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#8B4513',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    sanskrit: {
      fontFamily: '"Noto Sans Devanagari", serif',
      fontSize: '1.2rem',
      lineHeight: 1.8,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(139, 69, 19, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(139, 69, 19, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <WebSocketProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Navbar onMenuClick={toggleSidebar} />
              
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Sidebar />
                  </motion.div>
                )}
              </AnimatePresence>

              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  mt: 8,
                  ml: sidebarOpen ? 0 : 0,
                  transition: 'margin 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, #FFF8E7 0%, #F5F5DC 100%)',
                  minHeight: 'calc(100vh - 64px)',
                }}
              >
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Dashboard />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/upload" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ManuscriptUpload />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/workspace/:sessionId?" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ReconstructionWorkspace />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/knowledge-graph" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <KnowledgeGraph />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/assistant" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <AssistantChat />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/analytics" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Analytics />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Settings />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/gemini-restoration" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <GeminiRestoration />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/gemini-test" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <GeminiTextTest />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/tts-demo" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TTSDemo />
                        </motion.div>
                      } 
                    />
                  </Routes>
                </AnimatePresence>
              </Box>
            </Box>
          </Router>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#8B4513',
                color: '#FFFFFF',
                borderRadius: '8px',
              },
            }}
          />
        </WebSocketProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
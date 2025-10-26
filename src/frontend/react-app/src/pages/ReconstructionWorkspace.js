import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AutoFixHigh,
  Translate,
  Psychology,
  Visibility,
  VisibilityOff,
  ZoomIn,
  ZoomOut,
  Refresh,
  Save,
  Share,
  Settings,
  Timeline,
  Memory,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { reconstructText, setSelectedCandidate, updateSettings } from '../store/slices/reconstructionSlice';
import ManuscriptViewer from '../components/Reconstruction/ManuscriptViewer';
import CandidatesList from '../components/Reconstruction/CandidatesList';
import UncertaintyVisualization from '../components/Reconstruction/UncertaintyVisualization';
import GrammarAnalysis from '../components/Reconstruction/GrammarAnalysis';
import TranslationPanel from '../components/Reconstruction/TranslationPanel';
import RealtimeAssistant from '../components/Assistant/RealtimeAssistant';
import PerformanceMetrics from '../components/Analytics/PerformanceMetrics';
import EpisodicMemoryViewer from '../components/Reconstruction/EpisodicMemoryViewer';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workspace-tabpanel-${index}`}
      aria-labelledby={`workspace-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReconstructionWorkspace = () => {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  
  // Redux state
  const {
    candidates,
    selectedCandidate,
    isReconstructing,
    settings,
    uncertaintyScores,
    confidenceMetrics,
    timings,
    error,
  } = useSelector(state => state.reconstruction);
  
  const {
    sessionId: currentSessionId,
    selectedMasks,
    ocrText,
    masks,
  } = useSelector(state => state.manuscript);
  
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [showGrammarAnalysis, setShowGrammarAnalysis] = useState(true);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState('split'); // 'split', 'focus', 'analysis'
  
  // Handle reconstruction
  const handleReconstruct = useCallback(async () => {
    if (!currentSessionId || selectedMasks.length === 0) {
      toast.error('Please select damaged regions to reconstruct');
      return;
    }
    
    try {
      await dispatch(reconstructText({
        sessionId: currentSessionId,
        maskIds: selectedMasks,
        mode: settings.mode,
        nCandidates: settings.nCandidates,
      })).unwrap();
      
      toast.success('Reconstruction completed successfully!');
    } catch (error) {
      toast.error(`Reconstruction failed: ${error.message || error}`);
    }
  }, [dispatch, currentSessionId, selectedMasks, settings]);
  
  // Handle settings change
  const handleSettingsChange = (newSettings) => {
    dispatch(updateSettings(newSettings));
    
    // Auto-reconstruct if realtime mode is enabled
    if (realtimeMode && selectedMasks.length > 0) {
      setTimeout(handleReconstruct, 500); // Debounce
    }
  };
  
  // Handle candidate selection
  const handleCandidateSelect = (candidate) => {
    dispatch(setSelectedCandidate(candidate));
  };
  
  // Auto-load session if provided
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      // Load session data if needed
      console.log('Loading session:', sessionId);
    }
  }, [sessionId, currentSessionId]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            handleReconstruct();
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            if (candidates[index]) {
              handleCandidateSelect(candidates[index]);
            }
            break;
          default:
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleReconstruct, candidates]);
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoFixHigh sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Intelligent Reconstruction Workspace
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                AI-powered Sanskrit manuscript reconstruction with uncertainty quantification
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Realtime toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={realtimeMode}
                  onChange={(e) => setRealtimeMode(e.target.checked)}
                  color="secondary"
                />
              }
              label="Realtime"
              sx={{ color: 'white' }}
            />
            
            {/* Reconstruction button */}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AutoFixHigh />}
              onClick={handleReconstruct}
              disabled={isReconstructing || selectedMasks.length === 0}
              sx={{ minWidth: 140 }}
            >
              {isReconstructing ? 'Processing...' : 'Reconstruct'}
            </Button>
          </Box>
        </Box>
        
        {/* Progress bar */}
        {isReconstructing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              color="secondary" 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }} 
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Applying intelligent constraints and generating candidates...
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main workspace */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
        {/* Left panel - Manuscript viewer */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: workspaceLayout === 'analysis' ? '0 0 300px' : '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility />
              Manuscript Viewer
              <Chip 
                label={`${selectedMasks.length} regions selected`}
                size="small"
                color={selectedMasks.length > 0 ? 'primary' : 'default'}
              />
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <ManuscriptViewer
              showUncertainty={showUncertainty}
              realtimeMode={realtimeMode}
              onMaskSelectionChange={(masks) => {
                if (realtimeMode && masks.length > 0) {
                  setTimeout(handleReconstruct, 500);
                }
              }}
            />
          </Box>
        </Paper>
        
        {/* Right panel - Analysis and results */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: workspaceLayout === 'focus' ? '0 0 400px' : '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label="Candidates" 
                icon={<AutoFixHigh />} 
                iconPosition="start"
              />
              <Tab 
                label="Uncertainty" 
                icon={<Timeline />} 
                iconPosition="start"
              />
              <Tab 
                label="Grammar" 
                icon={<Psychology />} 
                iconPosition="start"
              />
              <Tab 
                label="Translation" 
                icon={<Translate />} 
                iconPosition="start"
              />
              <Tab 
                label="Memory" 
                icon={<Memory />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          {/* Tab panels */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <TabPanel value={activeTab} index={0}>
              <CandidatesList
                candidates={candidates}
                selectedCandidate={selectedCandidate}
                onCandidateSelect={handleCandidateSelect}
                showConfidence={true}
                showGrammarScore={true}
                realtimeMode={realtimeMode}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <UncertaintyVisualization
                candidates={candidates}
                uncertaintyScores={uncertaintyScores}
                confidenceMetrics={confidenceMetrics}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={2}>
              <GrammarAnalysis
                selectedCandidate={selectedCandidate}
                showRuleExplanations={true}
                interactive={true}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={3}>
              <TranslationPanel
                selectedCandidate={selectedCandidate}
                showAlignment={true}
                showConfidence={true}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={4}>
              <EpisodicMemoryViewer
                showSimilarCases={true}
                interactive={true}
              />
            </TabPanel>
          </Box>
        </Paper>
      </Box>
      
      {/* Bottom panel - Settings and assistant */}
      <Paper 
        elevation={2} 
        sx={{ 
          mt: 2, 
          p: 2,
          background: 'linear-gradient(135deg, #F5F5DC 0%, #FFF8E7 100%)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Reconstruction settings */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Reconstruction Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.mode === 'hard'}
                    onChange={(e) => handleSettingsChange({
                      mode: e.target.checked ? 'hard' : 'soft'
                    })}
                  />
                }
                label="Strict Grammar"
              />
              
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption">
                  Candidates: {settings.nCandidates}
                </Typography>
                <Slider
                  value={settings.nCandidates}
                  onChange={(e, value) => handleSettingsChange({ nCandidates: value })}
                  min={1}
                  max={10}
                  step={1}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
          
          {/* Performance metrics */}
          <Grid item xs={12} md={4}>
            <PerformanceMetrics
              timings={timings}
              compact={true}
            />
          </Grid>
          
          {/* Quick actions */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Tooltip title="Toggle uncertainty visualization">
                <IconButton
                  onClick={() => setShowUncertainty(!showUncertainty)}
                  color={showUncertainty ? 'primary' : 'default'}
                >
                  <Timeline />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Toggle grammar analysis">
                <IconButton
                  onClick={() => setShowGrammarAnalysis(!showGrammarAnalysis)}
                  color={showGrammarAnalysis ? 'primary' : 'default'}
                >
                  <Psychology />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Save workspace">
                <IconButton>
                  <Save />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Share results">
                <IconButton>
                  <Share />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Floating assistant */}
      <RealtimeAssistant
        context={{
          sessionId: currentSessionId,
          selectedCandidate,
          selectedMasks,
        }}
        position="bottom-right"
      />
    </Box>
  );
};

export default ReconstructionWorkspace;
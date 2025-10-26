import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
  Paper,
  Slider,
  Menu
} from '@mui/material';
import {
  VolumeUp,
  Pause,
  PlayArrow,
  Stop,
  Settings,
  RecordVoiceOver
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TextToSpeechPlayer = ({ 
  sanskritText = '', 
  englishText = '',
  disabled = false 
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('sanskrit');
  const [speechRate, setSpeechRate] = useState(0.8);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // Refs
  const utteranceRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Initialize speech synthesis and voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Find best Sanskrit/Hindi voice
        const sanskritVoice = voices.find(voice => 
          voice.lang.includes('hi') || 
          voice.lang.includes('sa') ||
          voice.name.toLowerCase().includes('hindi') ||
          voice.name.toLowerCase().includes('sanskrit')
        );
        
        // Find best English voice
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.default
        ) || voices.find(voice => voice.lang.includes('en'));
        
        setSelectedVoice(currentLanguage === 'sanskrit' ? sanskritVoice : englishVoice);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [currentLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Get current text based on language
  const getCurrentText = () => {
    return currentLanguage === 'sanskrit' ? sanskritText : englishText;
  };

  // Start speech synthesis
  const startSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    const textToSpeak = getCurrentText();
    if (!textToSpeak.trim()) {
      return;
    }

    setIsLoading(true);
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Configure utterance
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = volume;
    
    // Set language and voice
    if (currentLanguage === 'sanskrit') {
      utterance.lang = 'hi-IN'; // Hindi for Sanskrit pronunciation
    } else {
      utterance.lang = 'en-US';
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);
      
      // Start progress tracking
      let currentProgress = 0;
      
      progressIntervalRef.current = setInterval(() => {
        currentProgress += 1;
        const progressPercent = Math.min(currentProgress * 2, 100);
        setProgress(progressPercent);
      }, 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setTimeout(() => setProgress(0), 1000);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onresume = () => {
      setIsPaused(false);
      // Resume progress tracking
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 100);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  // Pause/Resume speech
  const togglePause = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
  };

  // Stop speech
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };



  // Handle settings menu
  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  // Check if text is available
  const hasText = getCurrentText().trim().length > 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
        border: '2px solid #d4af37',
        borderRadius: 2,
        maxWidth: 400
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RecordVoiceOver sx={{ color: '#8B4513', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#8B4513', fontWeight: 'bold' }}>
            Text-to-Speech
          </Typography>
        </Box>
        
        <Tooltip title="Speech Settings">
          <IconButton 
            onClick={handleSettingsClick}
            sx={{ color: '#8B4513' }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Language Toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={currentLanguage === 'sanskrit' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setCurrentLanguage('sanskrit')}
          disabled={!sanskritText.trim() || isPlaying}
          sx={{
            background: currentLanguage === 'sanskrit' 
              ? 'linear-gradient(45deg, #d4af37, #b8860b)' 
              : 'transparent',
            color: currentLanguage === 'sanskrit' ? 'white' : '#8B4513',
            borderColor: '#d4af37',
            fontFamily: 'Noto Sans Devanagari, serif',
            '&:hover': {
              background: currentLanguage === 'sanskrit' 
                ? 'linear-gradient(45deg, #b8860b, #9a7209)'
                : 'rgba(212, 175, 55, 0.1)'
            }
          }}
        >
          🕉️ Sanskrit
        </Button>
        
        <Button
          variant={currentLanguage === 'english' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setCurrentLanguage('english')}
          disabled={!englishText.trim() || isPlaying}
          sx={{
            background: currentLanguage === 'english' 
              ? 'linear-gradient(45deg, #4682b4, #2e5984)' 
              : 'transparent',
            color: currentLanguage === 'english' ? 'white' : '#4682b4',
            borderColor: '#4682b4',
            '&:hover': {
              background: currentLanguage === 'english' 
                ? 'linear-gradient(45deg, #2e5984, #1e3a5f)'
                : 'rgba(70, 130, 180, 0.1)'
            }
          }}
        >
          🇬🇧 English
        </Button>
      </Box>

      {/* Current Text Preview */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontFamily: currentLanguage === 'sanskrit' 
              ? 'Noto Sans Devanagari, serif' 
              : 'Georgia, serif',
            lineHeight: 1.6,
            color: '#333',
            maxHeight: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {getCurrentText() || `No ${currentLanguage} text available`}
        </Typography>
      </Paper>

      {/* Progress Bar */}
      <AnimatePresence>
        {(isPlaying || progress > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {isLoading ? 'Preparing...' : isPlaying ? 'Speaking...' : 'Complete'}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  bgcolor: '#e0e0e0',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(45deg, #d4af37, #b8860b)',
                    borderRadius: 2
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        {!isPlaying ? (
          <Button
            variant="contained"
            onClick={startSpeech}
            disabled={!hasText || disabled || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <VolumeUp />}
            sx={{
              background: 'linear-gradient(45deg, #d4af37, #b8860b)',
              color: 'white',
              px: 3,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(45deg, #b8860b, #9a7209)'
              },
              '&:disabled': {
                background: '#ccc',
                color: '#666'
              }
            }}
          >
            {isLoading ? 'Preparing...' : `🔊 Speak ${currentLanguage === 'sanskrit' ? 'Sanskrit' : 'English'}`}
          </Button>
        ) : (
          <>
            <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
              <IconButton
                onClick={togglePause}
                sx={{
                  background: 'linear-gradient(45deg, #d4af37, #b8860b)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #b8860b, #9a7209)'
                  }
                }}
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Stop">
              <IconButton
                onClick={stopSpeech}
                sx={{
                  background: 'linear-gradient(45deg, #dc3545, #c82333)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #c82333, #a71e2a)'
                  }
                }}
              >
                <Stop />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Status Chips */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
        <Chip
          label={`${currentLanguage === 'sanskrit' ? 'संस्कृत' : 'English'}`}
          size="small"
          sx={{
            backgroundColor: currentLanguage === 'sanskrit' ? '#fff3e0' : '#e3f2fd',
            color: currentLanguage === 'sanskrit' ? '#8B4513' : '#1976d2',
            fontFamily: currentLanguage === 'sanskrit' ? 'Noto Sans Devanagari, serif' : 'inherit'
          }}
        />
        
        {isPlaying && (
          <Chip
            label={isPaused ? 'Paused' : 'Speaking'}
            size="small"
            color={isPaused ? 'warning' : 'success'}
            sx={{ animation: isPaused ? 'none' : 'pulse 2s infinite' }}
          />
        )}
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={handleSettingsClose}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
            border: '1px solid #d4af37'
          }
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#8B4513', fontWeight: 'bold' }}>
            Speech Settings
          </Typography>
          
          {/* Speed Control */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Speed: {speechRate.toFixed(1)}x
            </Typography>
            <Slider
              value={speechRate}
              onChange={(_, value) => setSpeechRate(value)}
              min={0.5}
              max={2.0}
              step={0.1}
              size="small"
              sx={{
                color: '#d4af37',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#d4af37'
                }
              }}
            />
          </Box>

          {/* Pitch Control */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Pitch: {speechPitch.toFixed(1)}
            </Typography>
            <Slider
              value={speechPitch}
              onChange={(_, value) => setSpeechPitch(value)}
              min={0.5}
              max={2.0}
              step={0.1}
              size="small"
              sx={{
                color: '#d4af37',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#d4af37'
                }
              }}
            />
          </Box>

          {/* Volume Control */}
          <Box>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Volume: {Math.round(volume * 100)}%
            </Typography>
            <Slider
              value={volume}
              onChange={(_, value) => setVolume(value)}
              min={0}
              max={1}
              step={0.1}
              size="small"
              sx={{
                color: '#d4af37',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#d4af37'
                }
              }}
            />
          </Box>
        </Box>
      </Menu>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </Paper>
  );
};

export default TextToSpeechPlayer;
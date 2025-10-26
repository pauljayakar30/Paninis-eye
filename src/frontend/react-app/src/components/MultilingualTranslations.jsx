import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import {
  VolumeUp,
  ContentCopy,
  Download,
  CompareArrows,
  Translate,
  AutoMode,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const MultilingualTranslations = ({ 
  sanskritText = '', 
  autoTranslate = false,
  onAutoTranslateChange 
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [speakingLanguage, setSpeakingLanguage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Language configuration
  const languages = [
    {
      code: 'sa',
      name: 'Sanskrit',
      nativeName: 'संस्कृत',
      flag: '🕉️',
      font: 'Noto Sans Devanagari, serif',
      voice: 'hi-IN'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳',
      font: 'Noto Serif Devanagari, serif',
      voice: 'hi-IN'
    },
    {
      code: 'te',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      flag: '🇮🇳',
      font: 'Noto Sans Telugu, serif',
      voice: 'te-IN'
    },
    {
      code: 'ta',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      flag: '🇮🇳',
      font: 'Noto Sans Tamil, serif',
      voice: 'ta-IN'
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      font: 'Merriweather, serif',
      voice: 'en-US'
    }
  ];

  // Auto-translate when Sanskrit text changes
  useEffect(() => {
    if (sanskritText && autoTranslate && !translations[sanskritText]) {
      handleTranslateAll();
    }
  }, [sanskritText, autoTranslate]);

  // Translate to all languages
  const handleTranslateAll = async () => {
    if (!sanskritText.trim()) {
      showSnackbar('No Sanskrit text to translate', 'warning');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/translate/multilingual', {
        sanskrit_text: sanskritText,
        target_languages: ['hi', 'te', 'ta', 'en'],
        preserve_meter: true,
        style: 'poetic'
      });

      if (response.data.success) {
        const newTranslations = {
          sa: sanskritText,
          ...response.data.translations
        };
        
        setTranslations(prev => ({
          ...prev,
          [sanskritText]: newTranslations
        }));
        
        showSnackbar('🌐 All translations completed successfully!');
      } else {
        throw new Error(response.data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      showSnackbar('Translation failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current translations
  const getCurrentTranslations = () => {
    return translations[sanskritText] || { sa: sanskritText };
  };

  // Handle text-to-speech
  const handleSpeak = async (text, languageCode) => {
    if (speakingLanguage === languageCode) {
      window.speechSynthesis.cancel();
      setSpeakingLanguage(null);
      return;
    }

    setSpeakingLanguage(languageCode);
    
    try {
      // Use browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      const language = languages.find(lang => lang.code === languageCode);
      
      utterance.lang = language?.voice || 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setSpeakingLanguage(null);
      utterance.onerror = () => setSpeakingLanguage(null);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setSpeakingLanguage(null);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text, languageName) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar(`📋 ${languageName} translation copied to clipboard!`);
    } catch (error) {
      console.error('Copy error:', error);
      showSnackbar('Failed to copy text', 'error');
    }
  };

  // Handle download
  const handleDownload = (text, languageCode, format) => {
    const language = languages.find(lang => lang.code === languageCode);
    const fileName = `sanskrit-translation-${languageCode}-${Date.now()}`;
    
    if (format === 'txt') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSnackbar(`📄 ${language?.name} translation downloaded!`);
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const currentTranslations = getCurrentTranslations();
  const hasTranslations = Object.keys(currentTranslations).length > 1;

  return (
    <>
      <Card
        sx={{
          background: 'linear-gradient(145deg, #f4f1e8, #e8e5dc)',
          border: '2px solid #d4af37',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #d4af37, #b8860b)',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Translate sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                🌐 Multilingual Translations
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Sanskrit → Hindi, Telugu, Tamil, English
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoTranslate}
                  onChange={(e) => onAutoTranslateChange?.(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'white'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AutoMode sx={{ mr: 0.5, fontSize: 16 }} />
                  <Typography variant="caption">Auto-Translate</Typography>
                </Box>
              }
              sx={{ color: 'white', m: 0 }}
            />
            
            <Tooltip title="Toggle Compare View">
              <IconButton
                onClick={() => setCompareMode(!compareMode)}
                sx={{ 
                  color: 'white',
                  backgroundColor: compareMode ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              >
                <CompareArrows />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {!sanskritText ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                Complete Sanskrit text reconstruction to enable multilingual translations
              </Typography>
              <Chip
                label="🏛️ Awaiting Sanskrit Text"
                sx={{ backgroundColor: '#fff3e0', color: '#8B4513' }}
              />
            </Box>
          ) : (
            <>
              {/* Translation Controls */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleTranslateAll}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} /> : <Translate />}
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50, #45a049)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049, #3d8b40)'
                      }
                    }}
                  >
                    {isLoading ? 'Translating...' : 'Translate All Languages'}
                  </Button>
                  
                  {hasTranslations && (
                    <Chip
                      icon={<CheckCircle />}
                      label={`${Object.keys(currentTranslations).length - 1} translations ready`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              {/* Compare Mode */}
              {compareMode && hasTranslations ? (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#8B4513' }}>
                    📊 Side-by-Side Comparison
                  </Typography>
                  <Grid container spacing={2}>
                    {languages.map((language) => {
                      const text = currentTranslations[language.code];
                      if (!text) return null;
                      
                      return (
                        <Grid item xs={12} md={6} key={language.code}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
                              border: '1px solid #d4af37',
                              borderRadius: 2
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {language.flag} {language.nativeName}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }} />
                              <IconButton
                                size="small"
                                onClick={() => handleSpeak(text, language.code)}
                                disabled={!text}
                              >
                                <VolumeUp fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontFamily: language.font,
                                lineHeight: 1.8,
                                fontSize: language.code === 'sa' ? '1.1rem' : '1rem',
                                color: '#2c1810'
                              }}
                            >
                              {text}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ) : (
                /* Tab Mode */
                <>
                  <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      borderBottom: '1px solid #e0e0e0',
                      '& .MuiTab-root': {
                        minWidth: 120,
                        fontWeight: 'bold'
                      },
                      '& .Mui-selected': {
                        color: '#d4af37 !important'
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#d4af37'
                      }
                    }}
                  >
                    {languages.map((language, index) => (
                      <Tab
                        key={language.code}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{language.flag}</span>
                            <span>{language.nativeName}</span>
                            {currentTranslations[language.code] && language.code !== 'sa' && (
                              <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                            )}
                          </Box>
                        }
                        disabled={!currentTranslations[language.code]}
                      />
                    ))}
                  </Tabs>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{ p: 3 }}>
                        {languages.map((language, index) => {
                          if (index !== activeTab) return null;
                          
                          const text = currentTranslations[language.code];
                          
                          return (
                            <Box key={language.code}>
                              {/* Language Header */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography
                                  variant="h5"
                                  sx={{
                                    color: '#8B4513',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                >
                                  {language.flag} {language.name}
                                  {language.nativeName !== language.name && (
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontSize: '0.8em',
                                        color: '#666',
                                        fontFamily: language.font
                                      }}
                                    >
                                      ({language.nativeName})
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>

                              {/* Translation Text */}
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 3,
                                  mb: 3,
                                  background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
                                  border: '1px solid #d4af37',
                                  borderRadius: 2,
                                  minHeight: 120
                                }}
                              >
                                {text ? (
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: language.font,
                                      fontSize: language.code === 'sa' ? '1.2rem' : '1.1rem',
                                      lineHeight: 1.8,
                                      color: '#2c1810',
                                      textAlign: language.code === 'sa' ? 'center' : 'left',
                                      whiteSpace: 'pre-line'
                                    }}
                                  >
                                    {text}
                                  </Typography>
                                ) : (
                                  <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                                      {language.code === 'sa' 
                                        ? 'Original Sanskrit text will appear here'
                                        : `${language.name} translation not available`
                                      }
                                    </Typography>
                                    {language.code !== 'sa' && (
                                      <Button
                                        variant="outlined"
                                        onClick={handleTranslateAll}
                                        disabled={isLoading}
                                        size="small"
                                      >
                                        Generate Translation
                                      </Button>
                                    )}
                                  </Box>
                                )}
                              </Paper>

                              {/* Action Buttons */}
                              {text && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Tooltip title={`Listen in ${language.name}`}>
                                    <Button
                                      variant="outlined"
                                      startIcon={
                                        speakingLanguage === language.code ? 
                                        <CircularProgress size={16} /> : 
                                        <VolumeUp />
                                      }
                                      onClick={() => handleSpeak(text, language.code)}
                                      disabled={speakingLanguage === language.code}
                                      sx={{ borderColor: '#d4af37', color: '#8B4513' }}
                                    >
                                      🎧 Listen
                                    </Button>
                                  </Tooltip>

                                  <Tooltip title="Copy to Clipboard">
                                    <Button
                                      variant="outlined"
                                      startIcon={<ContentCopy />}
                                      onClick={() => handleCopy(text, language.name)}
                                      sx={{ borderColor: '#d4af37', color: '#8B4513' }}
                                    >
                                      📋 Copy
                                    </Button>
                                  </Tooltip>

                                  <Tooltip title="Download as Text">
                                    <Button
                                      variant="outlined"
                                      startIcon={<Download />}
                                      onClick={() => handleDownload(text, language.code, 'txt')}
                                      sx={{ borderColor: '#d4af37', color: '#8B4513' }}
                                    >
                                      💾 Download
                                    </Button>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            background: snackbar.severity === 'success'
              ? 'linear-gradient(45deg, #4caf50, #45a049)'
              : snackbar.severity === 'warning'
              ? 'linear-gradient(45deg, #ff9800, #f57c00)'
              : 'linear-gradient(45deg, #f44336, #d32f2f)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MultilingualTranslations;
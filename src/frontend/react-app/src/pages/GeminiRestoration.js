import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  Download,
  AutoFixHigh,
  Translate,
  TextFields,
  Language,
  Visibility,
  Psychology
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import TextToSpeechPlayer from '../components/TextToSpeechPlayer';
import AIGuruChat from '../components/AIGuruChat';
import ExportOptions from '../components/ExportOptions';
import MultilingualTranslations from '../components/MultilingualTranslations';

const GeminiRestoration = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [restoredText, setRestoredText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [restorationAnalysis, setRestorationAnalysis] = useState(null);
  const [translationAnalysis, setTranslationAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showAIGuru, setShowAIGuru] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      setProcessingComplete(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processWithGemini = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setCurrentStep('Preparing image...');

    try {
      // Step 1: Convert image to base64
      setProgress(20);
      setCurrentStep('Converting image format...');
      const base64Image = await convertImageToBase64(selectedImage);

      // Step 2: Analyze and restore with AI via backend
      setProgress(40);
      setCurrentStep('Analyzing manuscript with AI...');
      
      const restorationResponse = await axios.post('/api/gemini/restore', {
        image_data: base64Image,
        image_type: selectedImage.type
      });

      if (!restorationResponse.data.success) {
        throw new Error(restorationResponse.data.error || 'Restoration failed');
      }

      setProgress(70);
      setCurrentStep('Processing restoration results...');

      // Handle both simple text and JSON responses
      let restored = restorationResponse.data.restored_text;
      let fullResponse = restorationResponse.data.full_response;
      
      // Try to parse JSON response for detailed analysis
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisData = JSON.parse(jsonMatch[0]);
          restored = String(analysisData.reconstructed_text || restored);
          
          // Clean the analysis data to prevent object rendering issues
          const cleanAnalysisData = {
            language_detected: String(analysisData.language_detected || 'Sanskrit'),
            script: String(analysisData.script || 'Devanagari'),
            ocr_text: String(analysisData.ocr_text || ''),
            reconstructed_text: String(analysisData.reconstructed_text || restored),
            reconstruction_confidence: analysisData.reconstruction_confidence || {}
          };
          
          setRestorationAnalysis(cleanAnalysisData);
        }
      } catch (e) {
        // Fallback to simple text extraction
        console.log('Using fallback restoration format:', e);
        const restoredMatch = fullResponse.match(/RESTORED_TEXT:\s*(.+?)(?=\n|$)/);
        restored = restoredMatch ? restoredMatch[1].trim() : restored;
      }
      
      setRestoredText(restored);

      // Step 3: Translate to English
      setProgress(85);
      setCurrentStep('Translating to English...');

      const translationResponse = await axios.post('/api/gemini/translate', {
        sanskrit_text: restored,
        style: 'idiomatic'
      });

      if (!translationResponse.data.success) {
        throw new Error(translationResponse.data.error || 'Translation failed');
      }
      
      let translation = translationResponse.data.translation;
      let fullTranslationResponse = translationResponse.data.full_response;
      
      // Try to parse JSON response for detailed analysis
      try {
        const jsonMatch = fullTranslationResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisData = JSON.parse(jsonMatch[0]);
          
          // Safely extract translation data
          translation = {
            literal: typeof analysisData.literal_translation === 'string' 
              ? analysisData.literal_translation 
              : translation.literal || '',
            idiomatic: typeof analysisData.idiomatic_translation === 'string'
              ? analysisData.idiomatic_translation 
              : translation.idiomatic || '',
            context: typeof analysisData.cultural_context === 'string'
              ? analysisData.cultural_context 
              : translation.context || '',
            grammar: typeof analysisData.grammatical_notes === 'string'
              ? analysisData.grammatical_notes 
              : (Array.isArray(analysisData.grammatical_notes) 
                ? analysisData.grammatical_notes.map(note => 
                    typeof note === 'object' ? JSON.stringify(note) : String(note)
                  ).join('\n')
                : translation.grammar || '')
          };
          
          // Clean the analysis data to prevent object rendering issues
          const cleanAnalysisData = {
            ...analysisData,
            morphological_analysis: Array.isArray(analysisData.morphological_analysis)
              ? analysisData.morphological_analysis.map(item => ({
                  word: String(item.word || ''),
                  analysis: String(item.analysis || ''),
                  meaning: String(item.meaning || ''),
                  root: String(item.root || '')
                }))
              : []
          };
          
          setTranslationAnalysis(cleanAnalysisData);
        }
      } catch (e) {
        // Fallback to existing format
        console.log('Using fallback translation format:', e);
      }
      
      setTranslatedText(translation);
      
      setProgress(100);
      setCurrentStep('Complete!');
      setProcessingComplete(true);
      
    } catch (err) {
      console.error('Processing Error:', err);
      let errorMessage = 'Processing failed: ';
      
      if (err.response?.status === 403) {
        errorMessage += 'API access denied. Please check permissions.';
      } else if (err.response?.status === 429) {
        errorMessage += 'API quota exceeded. Please try again later.';
      } else if (err.response?.status >= 500) {
        errorMessage += 'Server error. Please try again later.';
      } else if (err.message?.includes('Network Error')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += err.message || err.response?.data?.error || 'Unknown error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = async () => {
    if (!resultsRef.current) return;

    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#f5f5dc',
        scale: 2
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('sanskrit-manuscript-restoration.pdf');
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f5dc 0%, #deb887 100%)',
      py: 4
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography 
          variant="h3" 
          align="center" 
          sx={{ 
            mb: 4,
            fontFamily: 'serif',
            color: '#8B4513',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🏛️ Sanskrit Manuscript Restoration
        </Typography>

        <Grid container spacing={4} sx={{ px: 4 }}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(145deg, #f4f1e8, #e8e5dc)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '2px solid #d4af37',
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ mb: 3, color: '#8B4513', fontWeight: 'bold' }}>
                    Upload Ancient Manuscript
                  </Typography>

                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      border: '3px dashed #d4af37',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: imagePreview ? 'transparent' : '#fafafa',
                      '&:hover': {
                        borderColor: '#b8860b',
                        backgroundColor: '#f9f9f9'
                      }
                    }}
                  >
                    {imagePreview ? (
                      <Box>
                        <img
                          src={imagePreview}
                          alt="Manuscript preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                          }}
                        />
                        <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                          Click to change image
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 64, color: '#d4af37', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#8B4513' }}>
                          Drop manuscript image here
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                          Supports JPG, PNG, TIFF formats
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={processWithGemini}
                    disabled={!selectedImage || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHigh />}
                    sx={{
                      mt: 3,
                      py: 1.5,
                      background: 'linear-gradient(45deg, #d4af37, #b8860b)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #b8860b, #9a7209)'
                      }
                    }}
                  >
                    {loading ? 'Processing with AI...' : 'Restore & Translate'}
                  </Button>

                  {loading && (
                    <Box sx={{ mt: 3 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(45deg, #d4af37, #b8860b)'
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#666' }}>
                        {currentStep} ({progress}%)
                      </Typography>
                    </Box>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <AnimatePresence>
              {processingComplete && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  ref={resultsRef}
                >
                  <Card sx={{ 
                    background: 'linear-gradient(145deg, #f4f1e8, #e8e5dc)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '2px solid #d4af37',
                    borderRadius: 3,
                    mb: 2
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ color: '#8B4513', fontWeight: 'bold' }}>
                           Restoration Results
                        </Typography>
                        <Box>
                          <Tooltip title="Download PDF">
                            <IconButton onClick={downloadResults} sx={{ color: '#d4af37' }}>
                              <Download />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Restored Sanskrit Text */}
                      <Paper sx={{ 
                        p: 3, 
                        mb: 3, 
                        background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
                        border: '1px solid #d4af37'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <TextFields sx={{ color: '#8B4513', mr: 1 }} />
                          <Typography variant="h6" sx={{ color: '#8B4513' }}>
                            Restored Sanskrit Text
                          </Typography>
                          {restorationAnalysis && (
                            <Chip 
                              label={`${restorationAnalysis.language_detected} - ${restorationAnalysis.script}`}
                              size="small" 
                              sx={{ ml: 2, backgroundColor: '#e8f5e8' }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontFamily: 'Noto Sans Devanagari, serif',
                            lineHeight: 1.8,
                            color: '#2c1810',
                            textAlign: 'center',
                            py: 2
                          }}
                        >
                          {restoredText}
                        </Typography>
                        
                        {/* Show OCR and confidence if available */}
                        {restorationAnalysis && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                               Analysis Details:
                            </Typography>
                            {restorationAnalysis.ocr_text && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>OCR Text:</strong> {restorationAnalysis.ocr_text}
                              </Typography>
                            )}
                            {restorationAnalysis.reconstruction_confidence && (
                              <Typography variant="body2">
                                <strong>Reconstructions:</strong> {Object.keys(restorationAnalysis.reconstruction_confidence).length} segments restored
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>

                      {/* English Translation */}
                      <Paper sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, #f0f8ff, #e6f3ff)',
                        border: '1px solid #4682b4'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Language sx={{ color: '#4682b4', mr: 1 }} />
                          <Typography variant="h6" sx={{ color: '#4682b4' }}>
                            English Translation
                          </Typography>
                        </Box>
                        
                        {translatedText.idiomatic && (
                          <Box sx={{ mb: 2 }}>
                            <Chip label="Idiomatic" size="small" sx={{ mb: 1, backgroundColor: '#e3f2fd' }} />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontFamily: 'Georgia, serif',
                                lineHeight: 1.6,
                                color: '#1a365d',
                                fontStyle: 'italic'
                              }}
                            >
                              "{translatedText.idiomatic}"
                            </Typography>
                          </Box>
                        )}

                        {translatedText.literal && (
                          <Box sx={{ mb: 2 }}>
                            <Chip label="Literal" size="small" sx={{ mb: 1, backgroundColor: '#f3e5f5' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#4a5568',
                                lineHeight: 1.5
                              }}
                            >
                              {translatedText.literal}
                            </Typography>
                          </Box>
                        )}

                        {translatedText.context && (
                          <Box sx={{ mb: 2 }}>
                            <Chip label="Cultural Context" size="small" sx={{ mb: 1, backgroundColor: '#fff3e0' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#5d4037',
                                lineHeight: 1.5,
                                fontStyle: 'italic'
                              }}
                            >
                              {translatedText.context}
                            </Typography>
                          </Box>
                        )}

                        {translatedText.grammar && (
                          <Box sx={{ mb: 2 }}>
                            <Chip label="Grammar Notes" size="small" sx={{ mb: 1, backgroundColor: '#e8f5e8' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#2e7d32',
                                lineHeight: 1.5,
                                fontFamily: 'monospace'
                              }}
                            >
                              {typeof translatedText.grammar === 'object' 
                                ? JSON.stringify(translatedText.grammar, null, 2)
                                : String(translatedText.grammar)
                              }
                            </Typography>
                          </Box>
                        )}

                        {/* Show detailed morphological analysis if available */}
                        {translationAnalysis && translationAnalysis.morphological_analysis && Array.isArray(translationAnalysis.morphological_analysis) && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                               Morphological Analysis:
                            </Typography>
                            {translationAnalysis.morphological_analysis.slice(0, 3).map((word, index) => {
                              // Safely handle word object
                              const wordText = typeof word === 'object' ? (word.word || '') : String(word);
                              const analysis = typeof word === 'object' ? (word.analysis || '') : '';
                              const meaning = typeof word === 'object' ? (word.meaning || '') : '';
                              
                              return (
                                <Typography key={index} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                                  <strong>{wordText}</strong> → {analysis} {meaning && `(${meaning})`}
                                </Typography>
                              );
                            })}
                            {translationAnalysis.confidence_score && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                Confidence: {(translationAnalysis.confidence_score * 100).toFixed(1)}%
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>

                      {/* Text-to-Speech Player */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <TextToSpeechPlayer
                          sanskritText={restoredText}
                          englishText={
                            typeof translatedText === 'object' 
                              ? (translatedText.idiomatic || translatedText.literal || '')
                              : String(translatedText || '')
                          }
                        />
                      </motion.div>

                      {/* AI Guru Chat Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                          <Button
                            variant="contained"
                            onClick={() => setShowAIGuru(true)}
                            startIcon={<Psychology />}
                            sx={{
                              background: 'linear-gradient(45deg, #6f42c1, #5a32a3)',
                              color: 'white',
                              px: 4,
                              py: 1.5,
                              fontSize: '1.1rem',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #5a32a3, #4c2a85)'
                              }
                            }}
                          >
                             Ask AI Guru
                          </Button>
                        </Box>
                      </motion.div>

                      {/* Export Options */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Box sx={{ mt: 3 }}>
                          <ExportOptions
                            sanskritText={restoredText}
                            englishTranslation={
                              typeof translatedText === 'object' 
                                ? (translatedText.idiomatic || translatedText.literal || '')
                                : String(translatedText || '')
                            }
                            grammarAnalysis={
                              typeof translatedText === 'object' 
                                ? String(translatedText.grammar || '')
                                : ''
                            }
                            culturalContext={
                              typeof translatedText === 'object' 
                                ? String(translatedText.context || '')
                                : ''
                            }
                            morphologicalAnalysis={
                              translationAnalysis?.morphological_analysis || []
                            }
                            confidence={
                              translationAnalysis?.confidence_score || 0.85
                            }
                          />
                        </Box>
                      </motion.div>

                      {/* Multilingual Translations */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        <Box sx={{ mt: 3 }}>
                          <MultilingualTranslations
                            sanskritText={restoredText}
                            autoTranslate={autoTranslate}
                            onAutoTranslateChange={setAutoTranslate}
                          />
                        </Box>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{ mt: 6, px: 4 }}>
            <Typography variant="h4" align="center" sx={{ mb: 4, color: '#8B4513' }}>
               Powered by Code Storm
            </Typography>
            
            <Grid container spacing={3}>
              {[
                { icon: <AutoFixHigh />, title: 'AI Restoration', desc: 'Advanced AI analyzes and restores damaged Sanskrit text' },
                { icon: <Translate />, title: 'Multilingual Translation', desc: 'Sanskrit to Hindi, Telugu, Tamil, and English' },
                { icon: <Language />, title: 'Text-to-Speech', desc: 'Listen to pronunciation in multiple languages' },
                { icon: <Psychology />, title: 'AI Guru Chat', desc: 'Interactive scholar for grammar and cultural questions' },
                { icon: <Visibility />, title: 'Cultural Context', desc: 'Provides historical and cultural significance' },
                { icon: <Download />, title: 'Export Options', desc: 'Download as PDF, TXT, or MP3 audio files' }
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card sx={{ 
                      textAlign: 'center', 
                      p: 3,
                      background: 'linear-gradient(145deg, #ffffff, #f8f8f8)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                    }}>
                      <Box sx={{ color: '#d4af37', mb: 2 }}>
                        {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1, color: '#8B4513' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {feature.desc}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </motion.div>

      {/* AI Guru Chat Modal */}
      {showAIGuru && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAIGuru(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <AIGuruChat
              sanskritText={restoredText}
              englishTranslation={
                typeof translatedText === 'object' 
                  ? (translatedText.idiomatic || translatedText.literal || '')
                  : String(translatedText || '')
              }
              onClose={() => setShowAIGuru(false)}
            />
          </motion.div>
        </Box>
      )}
    </Box>
  );
};

export default GeminiRestoration;
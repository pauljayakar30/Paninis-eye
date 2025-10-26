import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import {
  PictureAsPdf,
  TextFields,
  Headset,
  Download,
  CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

const ExportOptions = ({
  sanskritText = '',
  englishTranslation = '',
  grammarAnalysis = '',
  culturalContext = '',
  morphologicalAnalysis = [],
  confidence = 0
}) => {
  // State management
  const [loadingStates, setLoadingStates] = useState({
    pdf: false,
    txt: false,
    mp3: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Helper function to set loading state
  const setLoading = (type, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [type]: isLoading }));
  };

  // Helper function to show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Generate PDF Export
  const handlePDFExport = async () => {
    setLoading('pdf', true);
    
    try {
      // Create a temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '40px';
      tempContainer.style.backgroundColor = '#fff8dc';
      tempContainer.style.fontFamily = 'Georgia, serif';
      
      // Build PDF content
      tempContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B4513; font-size: 24px; margin-bottom: 10px;">
            🏛️ Sanskrit Manuscript Restoration Report
          </h1>
          <div style="border-bottom: 2px solid #d4af37; margin: 20px 0;"></div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #8B4513; font-size: 18px; margin-bottom: 10px;">
            📜 Restored Sanskrit Text
          </h2>
          <div style="background: #f5f5dc; padding: 15px; border: 1px solid #d4af37; border-radius: 8px; font-family: 'Noto Sans Devanagari', serif; font-size: 16px; line-height: 1.8; text-align: center;">
            ${sanskritText}
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="color: #4682b4; font-size: 18px; margin-bottom: 10px;">
            🌐 English Translation
          </h2>
          <div style="background: #f0f8ff; padding: 15px; border: 1px solid #4682b4; border-radius: 8px; font-style: italic; line-height: 1.6;">
            ${englishTranslation}
          </div>
        </div>
        
        ${grammarAnalysis ? `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #2e7d32; font-size: 18px; margin-bottom: 10px;">
            📚 Grammar Analysis
          </h2>
          <div style="background: #e8f5e8; padding: 15px; border: 1px solid #2e7d32; border-radius: 8px; font-family: monospace; font-size: 14px; line-height: 1.5;">
            ${grammarAnalysis}
          </div>
        </div>
        ` : ''}
        
        ${culturalContext ? `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #5d4037; font-size: 18px; margin-bottom: 10px;">
            🏛️ Cultural Context
          </h2>
          <div style="background: #fff3e0; padding: 15px; border: 1px solid #5d4037; border-radius: 8px; line-height: 1.6;">
            ${culturalContext}
          </div>
        </div>
        ` : ''}
        
        ${morphologicalAnalysis.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1976d2; font-size: 18px; margin-bottom: 10px;">
            🔍 Morphological Analysis
          </h2>
          <div style="background: #e3f2fd; padding: 15px; border: 1px solid #1976d2; border-radius: 8px;">
            ${morphologicalAnalysis.map(word => `
              <div style="margin-bottom: 8px; font-family: monospace; font-size: 14px;">
                <strong>${word.word || ''}</strong> → ${word.analysis || ''} (${word.meaning || ''})
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <div style="border-top: 1px solid #d4af37; padding-top: 15px;">
            Generated on ${new Date().toLocaleDateString()} | Confidence: ${Math.round(confidence * 100)}%
            <br>
            Sanskrit Manuscript Restoration Portal - AI-Powered Analysis
          </div>
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#fff8dc',
        scale: 2,
        useCORS: true
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Download PDF
      const fileName = `sanskrit-restoration-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      showSnackbar(`📄 PDF exported successfully: ${fileName}`);
      
    } catch (error) {
      console.error('PDF export error:', error);
      showSnackbar('Failed to export PDF. Please try again.', 'error');
    } finally {
      setLoading('pdf', false);
    }
  };

  // Generate TXT Export
  const handleTXTExport = () => {
    setLoading('txt', true);
    
    try {
      // Create text content
      const textContent = `Sanskrit Manuscript Restoration Report
${'='.repeat(50)}

Restored Sanskrit Text:
${sanskritText}

English Translation:
${englishTranslation}

${grammarAnalysis ? `Grammar Analysis:
${grammarAnalysis}

` : ''}${culturalContext ? `Cultural Context:
${culturalContext}

` : ''}${morphologicalAnalysis.length > 0 ? `Morphological Analysis:
${morphologicalAnalysis.map(word => 
  `${word.word || ''} → ${word.analysis || ''} (${word.meaning || ''})`
).join('\n')}

` : ''}Generated on: ${new Date().toLocaleString()}
Confidence: ${Math.round(confidence * 100)}%
Sanskrit Manuscript Restoration Portal`;

      // Create and download file
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sanskrit-restoration-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSnackbar('🗒️ Text file exported successfully!');
      
    } catch (error) {
      console.error('TXT export error:', error);
      showSnackbar('Failed to export text file. Please try again.', 'error');
    } finally {
      setLoading('txt', false);
    }
  };

  // Generate MP3 Export (Text-to-Speech)
  const handleMP3Export = async () => {
    setLoading('mp3', true);
    
    try {
      // TODO: Replace with AI Studio TTS API call
      // For now, using browser's speech synthesis to demonstrate
      
      // Prepare text for speech
      const speechText = `Sanskrit text: ${sanskritText}. English translation: ${englishTranslation}.`;
      
      // Check if browser supports speech synthesis
      if (!('speechSynthesis' in window)) {
        throw new Error('Text-to-speech not supported in this browser');
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      
      // For actual MP3 generation, you would call your backend API:
      /*
      const response = await axios.post('/api/tts/generate-mp3', {
        sanskrit_text: sanskritText,
        english_translation: englishTranslation,
        voice_settings: {
          language: 'hi-IN', // for Sanskrit
          rate: 0.8,
          pitch: 1.0
        }
      });
      
      if (response.data.success) {
        // Download the generated MP3 file
        const audioBlob = new Blob([response.data.audio_data], { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sanskrit-audio-${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSnackbar('🎧 Audio file exported successfully!');
      }
      */
      
      // For demo purposes, just play the speech
      utterance.onstart = () => {
        showSnackbar('🎧 Playing audio preview (MP3 export feature coming soon!)');
      };
      
      utterance.onend = () => {
        setLoading('mp3', false);
      };
      
      utterance.onerror = () => {
        throw new Error('Speech synthesis failed');
      };
      
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('MP3 export error:', error);
      showSnackbar('Failed to generate audio. Please try again.', 'error');
      setLoading('mp3', false);
    }
  };

  // Check if we have content to export
  const hasContent = sanskritText.trim() || englishTranslation.trim();

  return (
    <>
      <Card
        sx={{
          background: 'linear-gradient(145deg, #f4f1e8, #e8e5dc)',
          border: '2px solid #d4af37',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: '#8B4513',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Download sx={{ mr: 1 }} />
            Export Options
          </Typography>

          {!hasContent ? (
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
              Complete the restoration process to enable export options
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* PDF Export */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title="Download complete report as PDF with formatting">
                  <Button
                    variant="contained"
                    onClick={handlePDFExport}
                    disabled={loadingStates.pdf}
                    startIcon={loadingStates.pdf ? <CircularProgress size={16} /> : <PictureAsPdf />}
                    sx={{
                      background: 'linear-gradient(45deg, #dc3545, #c82333)',
                      color: 'white',
                      minWidth: 140,
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #c82333, #a71e2a)'
                      },
                      '&:disabled': {
                        background: '#ccc'
                      }
                    }}
                  >
                    📄 PDF
                  </Button>
                </Tooltip>
              </motion.div>

              {/* TXT Export */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title="Download as plain text file (Unicode Sanskrit)">
                  <Button
                    variant="contained"
                    onClick={handleTXTExport}
                    disabled={loadingStates.txt}
                    startIcon={loadingStates.txt ? <CircularProgress size={16} /> : <TextFields />}
                    sx={{
                      background: 'linear-gradient(45deg, #28a745, #218838)',
                      color: 'white',
                      minWidth: 140,
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #218838, #1e7e34)'
                      },
                      '&:disabled': {
                        background: '#ccc'
                      }
                    }}
                  >
                    🗒️ TXT
                  </Button>
                </Tooltip>
              </motion.div>

              {/* MP3 Export */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title="Generate audio file with Sanskrit pronunciation">
                  <Button
                    variant="contained"
                    onClick={handleMP3Export}
                    disabled={loadingStates.mp3}
                    startIcon={loadingStates.mp3 ? <CircularProgress size={16} /> : <Headset />}
                    sx={{
                      background: 'linear-gradient(45deg, #6f42c1, #5a32a3)',
                      color: 'white',
                      minWidth: 140,
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a32a3, #4c2a85)'
                      },
                      '&:disabled': {
                        background: '#ccc'
                      }
                    }}
                  >
                    🎧 MP3
                  </Button>
                </Tooltip>
              </motion.div>
            </Box>
          )}

          <Divider sx={{ my: 2, borderColor: '#d4af37' }} />

          {/* Export Info */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Export formats include Sanskrit text, English translation, and analysis
            </Typography>
            {hasContent && (
              <Typography variant="caption" sx={{ color: '#8B4513', fontWeight: 'bold' }}>
                ✨ Ready to export • Confidence: {Math.round(confidence * 100)}%
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Success/Error Snackbar */}
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

export default ExportOptions;
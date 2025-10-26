import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import TextToSpeechPlayer from './TextToSpeechPlayer';

const TTSDemo = () => {
  const sampleSanskrit = "राम वनं गच्छति। सीता गृहे तिष्ठति। धर्मो रक्षति रक्षितः।";
  const sampleEnglish = "Rama goes to the forest. Sita stays at home. Dharma protects those who protect it.";

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: '#8B4513' }}>
        🔊 Text-to-Speech Demo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#8B4513' }}>
          Sample Sanskrit Text:
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            fontFamily: 'Noto Sans Devanagari, serif',
            fontSize: '1.2rem',
            lineHeight: 1.8,
            mb: 2,
            color: '#2c1810'
          }}
        >
          {sampleSanskrit}
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 2, color: '#4682b4' }}>
          English Translation:
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            fontFamily: 'Georgia, serif',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            mb: 3,
            color: '#1a365d',
            fontStyle: 'italic'
          }}
        >
          {sampleEnglish}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <TextToSpeechPlayer
          sanskritText={sampleSanskrit}
          englishText={sampleEnglish}
        />
      </Box>
      
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f0f8ff' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
          🎯 Features:
        </Typography>
        <ul>
          <li><strong>Sanskrit Pronunciation:</strong> Uses Hindi (hi-IN) voice for proper Sanskrit pronunciation</li>
          <li><strong>Language Toggle:</strong> Switch between Sanskrit and English narration</li>
          <li><strong>Playback Controls:</strong> Play, pause, stop, and resume functionality</li>
          <li><strong>Progress Tracking:</strong> Visual progress bar during speech</li>
          <li><strong>Speech Settings:</strong> Adjustable speed, pitch, and volume</li>
          <li><strong>Beautiful UI:</strong> Parchment-themed design matching the app aesthetic</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default TTSDemo;
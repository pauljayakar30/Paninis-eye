import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = "AIzaSyBviFmaN5ZStts6Fcc64Hcmn_wGbPx3grQ";

const GeminiDemo = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testGemini = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = "Translate this Sanskrit text to English: 'राम वनं गच्छति'";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setResult(text);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Gemini API Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testGemini} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} /> : 'Test Gemini API'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body1">
            {result}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GeminiDemo;
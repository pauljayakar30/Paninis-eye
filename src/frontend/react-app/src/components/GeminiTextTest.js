import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import axios from 'axios';

const GeminiTextTest = () => {
  const [inputText, setInputText] = useState('राम वनं गच्छति');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testGeminiText = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Test Gemini API via backend
      const response = await axios.post('/api/gemini/test', {
        text: inputText
      });

      if (response.data.success) {
        setResult(`✅ Backend AI Integration Working!\n\nModel: ${response.data.model}\nStatus: ${response.data.status}\n\nResponse:\n${response.data.response}`);
      } else {
        throw new Error(response.data.error || 'API test failed');
      }
      
    } catch (err) {
      console.error('Gemini test failed:', err);
      setError(`Error: ${err.message || err.response?.data?.error || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🧪 AI Text Translation Test
          </Typography>
          
          <TextField
            fullWidth
            label="Sanskrit Text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Enter Sanskrit text in Devanagari"
          />
          
          <Button 
            variant="contained" 
            onClick={testGeminiText} 
            disabled={loading || !inputText.trim()}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Test AI Translation'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {result}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📝 Test Cases
          </Typography>
          
          {[
            'राम वनं गच्छति',
            'सीता गृहे तिष्ठति', 
            'धर्मो रक्षति रक्षितः',
            'सत्यमेव जयते'
          ].map((text, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => setInputText(text)}
              sx={{ mr: 1, mb: 1 }}
            >
              {text}
            </Button>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GeminiTextTest;
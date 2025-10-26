import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Send,
  VolumeUp,
  Psychology,
  AutoAwesome,
  School,
  Clear,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AIGuruChat = ({ 
  sanskritText = '', 
  englishTranslation = '',
  onClose 
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    if (sanskritText) {
      setMessages([{
        id: 1,
        type: 'guru',
        content: `नमस्ते! I am your AI Guru. I can help you understand the meaning, grammar, and cultural context of this Sanskrit text:\n\n"${sanskritText}"\n\nWhat would you like to know about it?`,
        timestamp: new Date()
      }]);
    }
  }, [sanskritText]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call AI backend for scholarly response
      const response = await axios.post('/api/guru/chat', {
        question: userMessage.content,
        sanskrit_text: sanskritText,
        english_translation: englishTranslation,
        conversation_history: messages.slice(-5) // Last 5 messages for context
      });

      if (response.data.success) {
        const guruMessage = {
          id: Date.now() + 1,
          type: 'guru',
          content: response.data.answer,
          grammar_notes: response.data.grammar_notes,
          cultural_context: response.data.cultural_context,
          sutra_references: response.data.sutra_references,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, guruMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'guru',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice reply
  const handleVoiceReply = async (messageContent) => {
    if (isSpeaking) return;

    setIsSpeaking(true);
    
    try {
      // Use browser's speech synthesis for now
      // TODO: Replace with AI Studio TTS API call
      const utterance = new SpeechSynthesisUtterance(messageContent);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Clear conversation
  const handleClearChat = () => {
    setMessages([{
      id: 1,
      type: 'guru',
      content: `नमस्ते! I am your AI Guru. I can help you understand the meaning, grammar, and cultural context of this Sanskrit text:\n\n"${sanskritText}"\n\nWhat would you like to know about it?`,
      timestamp: new Date()
    }]);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 600,
        height: 600,
        background: 'linear-gradient(145deg, #f4f1e8, #e8e5dc)',
        border: '3px solid #d4af37',
        borderRadius: 3,
        boxShadow: '0 12px 40px rgba(139, 69, 19, 0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #d4af37, #b8860b)',
          color: 'white',
          p: 2,
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <Psychology sx={{ color: '#d4af37' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              🧙‍♂️ AI Guru
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Sanskrit Scholar & Grammar Expert
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Tooltip title="Clear Chat">
            <IconButton onClick={handleClearChat} sx={{ color: 'white', mr: 1 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close Chat">
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <Clear />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Sanskrit Text Header */}
      {sanskritText && (
        <Paper
          sx={{
            m: 2,
            p: 2,
            background: 'linear-gradient(135deg, #fff8dc, #f5f5dc)',
            border: '1px solid #d4af37',
            borderRadius: 2
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'Noto Sans Devanagari, serif',
              fontSize: '1.1rem',
              textAlign: 'center',
              color: '#8B4513',
              lineHeight: 1.6
            }}
          >
            "{sanskritText}"
          </Typography>
          {englishTranslation && (
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: '#666',
                mt: 1,
                fontStyle: 'italic'
              }}
            >
              {englishTranslation}
            </Typography>
          )}
        </Paper>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          background: 'rgba(255, 248, 220, 0.3)'
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    maxWidth: '80%',
                    p: 2,
                    background: message.type === 'user'
                      ? 'linear-gradient(135deg, #4682b4, #2e5984)'
                      : message.isError
                      ? 'linear-gradient(135deg, #f44336, #d32f2f)'
                      : 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                    color: message.type === 'user' || message.isError ? 'white' : '#333',
                    borderRadius: message.type === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    border: message.type === 'guru' && !message.isError ? '1px solid #d4af37' : 'none'
                  }}
                >
                  {/* Message Content */}
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      fontFamily: message.content.includes('sanskrit') || /[\u0900-\u097F]/.test(message.content)
                        ? 'Noto Sans Devanagari, serif'
                        : 'inherit'
                    }}
                  >
                    {message.content}
                  </Typography>

                  {/* Grammar Notes */}
                  {message.grammar_notes && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label="📚 Grammar Notes"
                        size="small"
                        sx={{ mb: 1, backgroundColor: '#e8f5e8' }}
                      />
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontFamily: 'monospace' }}>
                        {message.grammar_notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Cultural Context */}
                  {message.cultural_context && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label="🏛️ Cultural Context"
                        size="small"
                        sx={{ mb: 1, backgroundColor: '#fff3e0' }}
                      />
                      <Typography variant="body2" sx={{ color: '#5d4037', fontStyle: 'italic' }}>
                        {message.cultural_context}
                      </Typography>
                    </Box>
                  )}

                  {/* Sutra References */}
                  {message.sutra_references && message.sutra_references.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label="📖 Sutra References"
                        size="small"
                        sx={{ mb: 1, backgroundColor: '#e3f2fd' }}
                      />
                      {message.sutra_references.map((sutra, index) => (
                        <Typography key={index} variant="body2" sx={{ color: '#1976d2', fontSize: '0.85rem' }}>
                          {sutra}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* Message Actions */}
                  {message.type === 'guru' && !message.isError && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Tooltip title="Listen to Response">
                        <IconButton
                          size="small"
                          onClick={() => handleVoiceReply(message.content)}
                          disabled={isSpeaking}
                          sx={{ color: message.type === 'user' ? 'white' : '#666' }}
                        >
                          {isSpeaking ? <CircularProgress size={16} /> : <VolumeUp />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {/* Timestamp */}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'right',
                      mt: 1,
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                  border: '1px solid #d4af37',
                  borderRadius: '20px 20px 20px 5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CircularProgress size={16} sx={{ mr: 1, color: '#d4af37' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  AI Guru is thinking...
                </Typography>
              </Paper>
            </Box>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider sx={{ borderColor: '#d4af37' }} />

      {/* Input Area */}
      <Box sx={{ p: 2, background: 'rgba(255, 248, 220, 0.5)' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about grammar, meaning, cultural context, or sutras..."
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'white',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#d4af37'
                },
                '&:hover fieldset': {
                  borderColor: '#b8860b'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#d4af37'
                }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{
              minWidth: 'auto',
              p: 1.5,
              background: 'linear-gradient(45deg, #d4af37, #b8860b)',
              '&:hover': {
                background: 'linear-gradient(45deg, #b8860b, #9a7209)'
              },
              '&:disabled': {
                background: '#ccc'
              }
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : <Send />}
          </Button>
        </Box>

        {/* Quick Questions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            'What is the grammar structure?',
            'Explain the cultural significance',
            'Which sutras apply here?',
            'Break down the morphology'
          ].map((question, index) => (
            <Chip
              key={index}
              label={question}
              size="small"
              onClick={() => setInputMessage(question)}
              sx={{
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                color: '#8B4513',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.2)'
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
};

export default AIGuruChat;
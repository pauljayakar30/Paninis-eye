import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Collapse,
  Button,
  Divider,
} from '@mui/material';
import {
  School,
  Send,
  Close,
  VolumeUp,
  Psychology,
  Lightbulb,
  QuestionAnswer,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { queryAssistant, addMessage } from '../../store/slices/assistantSlice';
import { useWebSocket } from '../../providers/WebSocketProvider';

const RealtimeAssistant = ({ 
  context = {}, 
  position = 'bottom-right' 
}) => {
  const dispatch = useDispatch();
  const { sendAssistantQuery } = useWebSocket();
  
  const { messages, isProcessing } = useSelector(state => state.assistant);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [suggestions] = useState([
    'Explain this grammar rule',
    'What does this sutra mean?',
    'Show similar examples',
    'Why was this reconstruction chosen?',
  ]);
  
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
    };
    
    dispatch(addMessage(userMessage));
    
    // Send via WebSocket for real-time response
    sendAssistantQuery(currentMessage, context);
    
    // Also dispatch Redux action as fallback
    try {
      await dispatch(queryAssistant({
        query: currentMessage,
        context,
      }));
    } catch (error) {
      console.error('Assistant query failed:', error);
    }
    
    setCurrentMessage('');
  };
  
  const handleSuggestionClick = (suggestion) => {
    setCurrentMessage(suggestion);
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1300,
    },
    'bottom-left': {
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 1300,
    },
  };
  
  return (
    <Box sx={positionStyles[position]}>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 400,
                height: 500,
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      Sanskrit Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      AI-powered grammar expert
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton
                  onClick={() => setIsOpen(false)}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <Close />
                </IconButton>
              </Box>
              
              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 1,
                  backgroundColor: '#f5f5f5',
                }}
              >
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Ask me about Sanskrit grammar, sutras, or reconstruction decisions!
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                
                {isProcessing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: 'primary.main' }}>
                      <School sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Assistant is thinking...
                    </Typography>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Suggestions */}
              {messages.length === 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Quick questions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask about grammar, sutras, or translations..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={3}
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isProcessing}
                    color="primary"
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #654321 0%, #8B4513 100%)',
          },
        }}
      >
        {isOpen ? <Close /> : <School />}
      </Fab>
    </Box>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  const handlePlayAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '80%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: isUser ? 'secondary.main' : 'primary.main',
          }}
        >
          {isUser ? <QuestionAnswer sx={{ fontSize: 16 }} /> : <School sx={{ fontSize: 16 }} />}
        </Avatar>
        
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser ? 'primary.main' : 'white',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: isUser ? 2 : 0.5,
            borderTopRightRadius: isUser ? 0.5 : 2,
          }}
        >
          <Typography variant="body2">
            {message.content}
          </Typography>
          
          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Sources:
              </Typography>
              {message.sources.map((source, index) => (
                <Chip
                  key={index}
                  label={source.kg_node || source.type}
                  size="small"
                  sx={{ 
                    ml: 0.5, 
                    mt: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'inherit',
                  }}
                />
              ))}
            </Box>
          )}
          
          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {message.actions.map((action, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    color: 'inherit',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.8)',
                    },
                  }}
                >
                  {action}
                </Button>
              ))}
            </Box>
          )}
          
          {/* Audio button for assistant messages */}
          {!isUser && (
            <IconButton
              size="small"
              onClick={() => handlePlayAudio(message.content)}
              sx={{ 
                mt: 1, 
                color: 'primary.main',
                '&:hover': { backgroundColor: 'primary.50' },
              }}
            >
              <VolumeUp sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          
          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default RealtimeAssistant;
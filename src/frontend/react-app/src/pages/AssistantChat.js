import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  School,
  Send,
  Psychology,
  Lightbulb,
  VolumeUp,
  Clear,
  QuestionAnswer,
  MenuBook,
  Translate,
  Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { queryAssistant, addMessage, clearConversation } from '../store/slices/assistantSlice';
import { useWebSocket } from '../providers/WebSocketProvider';

const AssistantChat = () => {
  const dispatch = useDispatch();
  const { sendAssistantQuery } = useWebSocket();
  
  const { messages, isProcessing, suggestions } = useSelector(state => state.assistant);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('general');
  
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Predefined topics and questions
  const topics = {
    general: {
      name: 'General Sanskrit',
      icon: <School />,
      color: 'primary',
      questions: [
        'What is Sanskrit?',
        'How does Devanagari script work?',
        'What are the main features of Sanskrit grammar?',
        'Tell me about Panini and his grammar',
      ]
    },
    grammar: {
      name: 'Grammar Rules',
      icon: <Psychology />,
      color: 'secondary',
      questions: [
        'Explain sutra 6.1.87',
        'What is sandhi?',
        'How do vibhakti cases work?',
        'What are the different lakaras?',
      ]
    },
    translation: {
      name: 'Translation',
      icon: <Translate />,
      color: 'info',
      questions: [
        'How do you translate compound words?',
        'What is the difference between literal and idiomatic translation?',
        'How do you handle cultural context in translation?',
        'What are common translation challenges?',
      ]
    },
    reconstruction: {
      name: 'Reconstruction',
      icon: <Timeline />,
      color: 'success',
      questions: [
        'How does AI reconstruction work?',
        'What is uncertainty quantification?',
        'How do you handle damaged manuscripts?',
        'What makes a good reconstruction candidate?',
      ]
    }
  };
  
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
    
    // Send query
    try {
      await dispatch(queryAssistant({
        query: currentMessage,
        context: { topic: selectedTopic },
      }));
    } catch (error) {
      console.error('Assistant query failed:', error);
    }
    
    setCurrentMessage('');
  };
  
  const handleQuestionClick = (question) => {
    setCurrentMessage(question);
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearConversation = () => {
    dispatch(clearConversation());
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Sanskrit AI Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask questions about Sanskrit grammar, translation, and manuscript reconstruction
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              height: 600,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {/* Chat Header */}
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
                    Sanskrit Expert Assistant
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Powered by Intelligent AI with Paninian Knowledge
                  </Typography>
                </Box>
              </Box>
              
              <IconButton
                onClick={handleClearConversation}
                sx={{ color: 'white' }}
                size="small"
              >
                <Clear />
              </IconButton>
            </Box>
            
            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: '#f8f9fa',
              }}
            >
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Welcome to the Sanskrit AI Assistant!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    I can help you understand Sanskrit grammar, explain Paninian sutras,
                    assist with translations, and explain how our AI reconstruction works.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a topic on the right or ask me anything!
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </AnimatePresence>
              )}
              
              {isProcessing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
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
            
            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Ask about Sanskrit grammar, sutras, translation, or AI reconstruction..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={3}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isProcessing}
                  sx={{ minWidth: 100 }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Topic Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📚 Topics
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(topics).map(([key, topic]) => (
                  <Button
                    key={key}
                    variant={selectedTopic === key ? 'contained' : 'outlined'}
                    color={topic.color}
                    startIcon={topic.icon}
                    onClick={() => setSelectedTopic(key)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {topic.name}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
          
          {/* Quick Questions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ❓ Quick Questions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {topics[selectedTopic].questions.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    onClick={() => handleQuestionClick(question)}
                    sx={{ 
                      cursor: 'pointer',
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'left',
                      }
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
          
          {/* Assistant Features */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 Assistant Features
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'primary.main', width: 32, height: 32 }}>
                    <MenuBook sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Paninian Grammar Expert
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Deep knowledge of 2000+ sutras and rules
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'secondary.main', width: 32, height: 32 }}>
                    <Lightbulb sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Interactive Learning
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Step-by-step explanations with examples
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'info.main', width: 32, height: 32 }}>
                    <Timeline sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      AI Insights
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Explains reconstruction decisions and confidence
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 3,
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
              width: 40,
              height: 40,
              backgroundColor: isUser ? 'secondary.main' : 'primary.main',
            }}
          >
            {isUser ? <QuestionAnswer /> : <School />}
          </Avatar>
          
          <Paper
            elevation={2}
            sx={{
              p: 2,
              backgroundColor: isUser ? 'primary.main' : 'white',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: 2,
              borderTopLeftRadius: isUser ? 2 : 0.5,
              borderTopRightRadius: isUser ? 0.5 : 2,
            }}
          >
            <Typography variant="body1" paragraph>
              {message.content}
            </Typography>
            
            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                  Sources:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {message.sources.map((source, index) => (
                    <Chip
                      key={index}
                      label={source.kg_node || source.type}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'inherit',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Actions */}
            {message.actions && message.actions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
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
                    {action.replace('_', ' ')}
                  </Button>
                ))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mt: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
              
              {!isUser && (
                <IconButton
                  size="small"
                  onClick={() => handlePlayAudio(message.content)}
                  sx={{ 
                    color: 'inherit',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <VolumeUp sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </motion.div>
  );
};

export default AssistantChat;
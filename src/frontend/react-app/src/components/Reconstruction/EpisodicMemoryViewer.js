import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Memory,
  Compare,
  History,
  Lightbulb,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';

const EpisodicMemoryViewer = ({ 
  showSimilarCases = true, 
  interactive = true 
}) => {
  const [selectedMemory, setSelectedMemory] = useState(null);
  
  // Mock episodic memory data
  const memoryEntries = [
    {
      id: 'mem_001',
      originalText: 'राम वनं गच्छति',
      reconstructedText: 'राम वनं गच्छति',
      similarity: 0.92,
      confidence: 0.88,
      timestamp: '2024-01-15T10:30:00Z',
      context: 'Similar damage pattern in palm leaf manuscript',
      success: true,
      userFeedback: 'accepted',
    },
    {
      id: 'mem_002',
      originalText: 'सीता गृहे तिष्ठति',
      reconstructedText: 'सीता गृहे तिष्ठति',
      similarity: 0.87,
      confidence: 0.91,
      timestamp: '2024-01-14T15:45:00Z',
      context: 'Ink fade damage, similar morphology',
      success: true,
      userFeedback: 'accepted',
    },
    {
      id: 'mem_003',
      originalText: 'धर्मो रक्षति रक्षितः',
      reconstructedText: 'धर्मो रक्षति रक्षितः',
      similarity: 0.79,
      confidence: 0.85,
      timestamp: '2024-01-13T09:20:00Z',
      context: 'Water damage, compound word structure',
      success: true,
      userFeedback: 'corrected',
    },
    {
      id: 'mem_004',
      originalText: 'विद्या ददाति विनयम्',
      reconstructedText: 'विद्या ददाति विनयम्',
      similarity: 0.74,
      confidence: 0.79,
      timestamp: '2024-01-12T14:10:00Z',
      context: 'Torn manuscript, sandhi rules applied',
      success: false,
      userFeedback: 'rejected',
    },
  ];
  
  const memoryStats = {
    totalMemories: 156,
    successRate: 0.87,
    avgSimilarity: 0.82,
    recentLearning: 12,
  };
  
  const handleMemorySelect = (memory) => {
    setSelectedMemory(memory);
  };
  
  const handleApplyMemory = (memory) => {
    // Apply memory-guided reconstruction
    console.log('Applying memory:', memory);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Episodic Memory
      </Typography>
      
      {/* Memory Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="primary">
                {memoryStats.totalMemories}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="success.main">
                {Math.round(memoryStats.successRate * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="info.main">
                {Math.round(memoryStats.avgSimilarity * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Similarity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="secondary.main">
                {memoryStats.recentLearning}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recent Learning
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Similar Cases */}
      {showSimilarCases && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Similar Reconstruction Cases
            </Typography>
            
            {memoryEntries.map((memory) => (
              <Card
                key={memory.id}
                variant="outlined"
                sx={{
                  mb: 2,
                  cursor: interactive ? 'pointer' : 'default',
                  border: selectedMemory?.id === memory.id ? 2 : 1,
                  borderColor: selectedMemory?.id === memory.id ? 'primary.main' : 'divider',
                  '&:hover': interactive ? {
                    boxShadow: 2,
                    borderColor: 'primary.light',
                  } : {},
                }}
                onClick={() => interactive && handleMemorySelect(memory)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: memory.success ? 'success.main' : 'error.main',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {memory.success ? <TrendingUp sx={{ fontSize: 16 }} /> : <Memory sx={{ fontSize: 16 }} />}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        Case #{memory.id.split('_')[1]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${Math.round(memory.similarity * 100)}% similar`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={memory.userFeedback}
                        size="small"
                        color={memory.userFeedback === 'accepted' ? 'success' : 
                               memory.userFeedback === 'corrected' ? 'warning' : 'error'}
                      />
                    </Box>
                  </Box>
                  
                  {/* Sanskrit text */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: '"Noto Sans Devanagari", serif',
                      mb: 1,
                      p: 1,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                    }}
                  >
                    {memory.reconstructedText}
                  </Typography>
                  
                  {/* Context and confidence */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {memory.context}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">
                        Confidence: {Math.round(memory.confidence * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={memory.confidence * 100}
                        sx={{ width: 60, height: 4 }}
                        color={memory.confidence > 0.8 ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>
                  
                  {/* Actions */}
                  {interactive && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<Lightbulb />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyMemory(memory);
                        }}
                      >
                        Apply Pattern
                      </Button>
                      
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        variant="outlined"
                      >
                        View Details
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Memory Insights */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Memory Insights
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ backgroundColor: 'info.main', width: 32, height: 32 }}>
                <Compare sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Pattern Recognition
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI has learned from 156 similar reconstruction cases
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ backgroundColor: 'success.main', width: 32, height: 32 }}>
                <TrendingUp sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Continuous Learning
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Model improves with each user interaction and feedback
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ backgroundColor: 'secondary.main', width: 32, height: 32 }}>
                <History sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Historical Context
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Leverages patterns from historical manuscript reconstructions
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EpisodicMemoryViewer;
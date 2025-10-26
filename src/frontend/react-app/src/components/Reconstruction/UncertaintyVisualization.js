import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UncertaintyVisualization = ({ 
  candidates = [], 
  uncertaintyScores = {}, 
  confidenceMetrics = {} 
}) => {
  // Prepare data for visualization
  const uncertaintyData = candidates.map((candidate, index) => {
    const uncertainty = uncertaintyScores[candidate.candidate_id] || {};
    return {
      name: `Candidate ${index + 1}`,
      epistemic: (1 - (uncertainty.epistemic_uncertainty || 0)) * 100,
      aleatoric: (1 - (uncertainty.aleatoric_uncertainty || 0)) * 100,
      total: (uncertainty.confidence || 0) * 100,
    };
  });
  
  const confidenceDistribution = [
    { name: 'Very High (90-100%)', value: 15, color: '#4CAF50' },
    { name: 'High (80-90%)', value: 25, color: '#8BC34A' },
    { name: 'Medium (70-80%)', value: 35, color: '#FFC107' },
    { name: 'Low (60-70%)', value: 20, color: '#FF9800' },
    { name: 'Very Low (<60%)', value: 5, color: '#F44336' },
  ];
  
  if (candidates.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Uncertainty Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate reconstruction candidates to see uncertainty analysis
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Uncertainty Analysis
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {Math.round(uncertaintyData.reduce((sum, d) => sum + d.total, 0) / uncertaintyData.length)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {uncertaintyData.filter(d => d.total > 80).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Confidence Candidates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {uncertaintyData.filter(d => d.total < 60).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Confidence Candidates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Uncertainty Breakdown Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Uncertainty Breakdown by Candidate
          </Typography>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={uncertaintyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="epistemic" stackId="a" fill="#2196F3" name="Model Uncertainty" />
              <Bar dataKey="aleatoric" stackId="a" fill="#FF9800" name="Data Uncertainty" />
            </BarChart>
          </ResponsiveContainer>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Chip
              icon={<Box sx={{ width: 12, height: 12, backgroundColor: '#2196F3', borderRadius: '50%' }} />}
              label="Model Uncertainty (Epistemic)"
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<Box sx={{ width: 12, height: 12, backgroundColor: '#FF9800', borderRadius: '50%' }} />}
              label="Data Uncertainty (Aleatoric)"
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* Confidence Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Confidence Distribution
              </Typography>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={confidenceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                  >
                    {confidenceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Candidate Details
              </Typography>
              
              {candidates.slice(0, 5).map((candidate, index) => {
                const uncertainty = uncertaintyScores[candidate.candidate_id] || {};
                const confidence = uncertainty.confidence || 0;
                
                return (
                  <Box key={candidate.candidate_id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Candidate {index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {confidence > 0.8 ? (
                          <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : confidence < 0.6 ? (
                          <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                        ) : (
                          <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round(confidence * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={confidence * 100}
                      color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {candidate.sanskrit_text}
                    </Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Uncertainty Insights */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Understanding Uncertainty:</strong> Model uncertainty (epistemic) can be reduced with more training data, 
          while data uncertainty (aleatoric) reflects inherent ambiguity in the damaged text. 
          High confidence candidates are more likely to be grammatically correct.
        </Typography>
      </Alert>
    </Box>
  );
};

export default UncertaintyVisualization;
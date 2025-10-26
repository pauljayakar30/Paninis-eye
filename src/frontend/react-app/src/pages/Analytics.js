import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  CheckCircle,
  Psychology,
  Timeline,
  Memory,
  Download,
  Refresh,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  
  // Mock analytics data
  const [analyticsData] = useState({
    overview: {
      totalReconstructions: 1247,
      averageAccuracy: 87.3,
      averageConfidence: 82.1,
      processingSpeed: 2.3,
      userSatisfaction: 4.2,
    },
    
    performanceTrends: [
      { date: '2024-01-01', accuracy: 85, confidence: 78, speed: 2.8 },
      { date: '2024-01-02', accuracy: 86, confidence: 80, speed: 2.6 },
      { date: '2024-01-03', accuracy: 87, confidence: 82, speed: 2.4 },
      { date: '2024-01-04', accuracy: 88, confidence: 84, speed: 2.2 },
      { date: '2024-01-05', accuracy: 87, confidence: 83, speed: 2.3 },
      { date: '2024-01-06', accuracy: 89, confidence: 85, speed: 2.1 },
      { date: '2024-01-07', accuracy: 87, confidence: 82, speed: 2.3 },
    ],
    
    reconstructionTypes: [
      { name: 'Conservative', value: 45, color: '#4CAF50' },
      { name: 'Creative', value: 30, color: '#FF9800' },
      { name: 'Memory-Guided', value: 25, color: '#2196F3' },
    ],
    
    grammarCompliance: [
      { rule: 'Sandhi Rules', compliance: 94, violations: 6 },
      { rule: 'Morphology', compliance: 91, violations: 9 },
      { rule: 'Vibhakti', compliance: 88, violations: 12 },
      { rule: 'Compound Words', compliance: 85, violations: 15 },
      { rule: 'Verb Forms', compliance: 92, violations: 8 },
    ],
    
    uncertaintyDistribution: [
      { range: '90-100%', count: 156, percentage: 25 },
      { range: '80-90%', count: 187, percentage: 30 },
      { range: '70-80%', count: 156, percentage: 25 },
      { range: '60-70%', count: 94, percentage: 15 },
      { range: '<60%', count: 31, percentage: 5 },
    ],
    
    userFeedback: {
      accepted: 78,
      corrected: 15,
      rejected: 7,
    },
    
    modelPerformance: {
      episodicMemoryHits: 234,
      kgRulesApplied: 1456,
      uncertaintyCalibration: 0.92,
      adaptationSpeed: 0.85,
    }
  });
  
  const handleRefresh = () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => setLoading(false), 1000);
  };
  
  const handleExport = () => {
    // Simulate export functionality
    console.log('Exporting analytics data...');
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI Performance Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into Sanskrit reconstruction AI performance
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last Day</MenuItem>
              <MenuItem value="7d">Last Week</MenuItem>
              <MenuItem value="30d">Last Month</MenuItem>
              <MenuItem value="90d">Last Quarter</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>
      
      {loading && <LinearProgress sx={{ mb: 3 }} />}
      
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total Reconstructions"
            value={analyticsData.overview.totalReconstructions.toLocaleString()}
            icon={<Psychology />}
            color="primary"
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Average Accuracy"
            value={`${analyticsData.overview.averageAccuracy}%`}
            icon={<CheckCircle />}
            color="success"
            trend="+3.2%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Avg Confidence"
            value={`${analyticsData.overview.averageConfidence}%`}
            icon={<Timeline />}
            color="info"
            trend="+1.8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Processing Speed"
            value={`${analyticsData.overview.processingSpeed}s`}
            icon={<Speed />}
            color="warning"
            trend="-8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="User Satisfaction"
            value={analyticsData.overview.userSatisfaction}
            icon={<TrendingUp />}
            color="secondary"
            trend="+0.3"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Performance Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trends Over Time
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    name="Accuracy (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#2196F3" 
                    strokeWidth={2}
                    name="Confidence (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#FF9800" 
                    strokeWidth={2}
                    name="Speed (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reconstruction Types */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reconstruction Strategies
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.reconstructionTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {analyticsData.reconstructionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Grammar Compliance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grammar Rule Compliance
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.grammarCompliance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rule" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="compliance" fill="#4CAF50" name="Compliance %" />
                  <Bar dataKey="violations" fill="#F44336" name="Violations %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Uncertainty Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Confidence Distribution
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {analyticsData.uncertaintyDistribution.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                      <Typography variant="body2">
                        {item.range}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.count} ({item.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage * 4} // Scale to 100
                      color={
                        item.percentage > 25 ? 'success' :
                        item.percentage > 15 ? 'warning' : 'error'
                      }
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Feedback */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Feedback Analysis
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">Accepted</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analyticsData.userFeedback.accepted}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.userFeedback.accepted}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">Corrected</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analyticsData.userFeedback.corrected}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.userFeedback.corrected}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">Rejected</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analyticsData.userFeedback.rejected}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.userFeedback.rejected}
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* AI Model Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Model Performance
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Memory sx={{ color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">Episodic Memory Hits</Typography>
                    <Typography variant="h6" color="primary">
                      {analyticsData.modelPerformance.episodicMemoryHits}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Psychology sx={{ color: 'secondary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">KG Rules Applied</Typography>
                    <Typography variant="h6" color="secondary">
                      {analyticsData.modelPerformance.kgRulesApplied.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Timeline sx={{ color: 'info.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">Uncertainty Calibration</Typography>
                    <Typography variant="h6" color="info.main">
                      {(analyticsData.modelPerformance.uncertaintyCalibration * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Speed sx={{ color: 'success.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">Adaptation Speed</Typography>
                    <Typography variant="h6" color="success.main">
                      {(analyticsData.modelPerformance.adaptationSpeed * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Insights */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>AI Performance Insights:</strong> The model shows consistent improvement in accuracy 
          and confidence over time. Episodic memory is effectively contributing to better reconstructions, 
          with 234 successful memory hits this period. Grammar compliance remains high at 90%+ across 
          all rule categories.
        </Typography>
      </Alert>
    </Box>
  );
};

const MetricCard = ({ title, value, icon, color, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${
          color === 'primary' ? '#8B4513' :
          color === 'success' ? '#4CAF50' :
          color === 'info' ? '#2196F3' :
          color === 'warning' ? '#FF9800' :
          color === 'secondary' ? '#FF6B35' : '#8B4513'
        } 0%, ${
          color === 'primary' ? '#CD853F' :
          color === 'success' ? '#66BB6A' :
          color === 'info' ? '#42A5F5' :
          color === 'warning' ? '#FFB74D' :
          color === 'secondary' ? '#FF8A65' : '#CD853F'
        } 100%)`,
        color: 'white',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            {trend && (
              <Chip
                label={trend}
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              />
            )}
          </Box>
          <Box sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

export default Analytics;
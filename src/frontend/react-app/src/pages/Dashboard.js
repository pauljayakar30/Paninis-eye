import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import {
  Upload,
  AutoFixHigh,
  Psychology,
  Translate,
  Timeline,
  Memory,
  School,
  TrendingUp,
  Speed,
  CheckCircle,
  CloudUpload,
  History,
  Star,
  PlayArrow,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { healthAPI, analyticsAPI } from '../services/api';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color === 'primary' ? '#8B4513' : 
                   color === 'secondary' ? '#FF6B35' : 
                   color === 'success' ? '#4CAF50' : 
                   color === 'info' ? '#2196F3' : '#8B4513'} 0%, ${
                   color === 'primary' ? '#CD853F' : 
                   color === 'secondary' ? '#FF8A65' : 
                   color === 'success' ? '#66BB6A' : 
                   color === 'info' ? '#42A5F5' : '#CD853F'} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
          </Box>
          <Avatar
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        {trend && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              {trend > 0 ? '+' : ''}{trend}% from last week
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      />
    </Card>
  </motion.div>
);

const QuickActionCard = ({ title, description, icon, onClick, color = 'primary' }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: 6,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const RecentActivity = ({ activities = [] }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      
      {activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography>No recent activity</Typography>
        </Box>
      ) : (
        <Box>
          {activities.map((activity, index) => (
            <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < activities.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 32, height: 32, backgroundColor: 'primary.main' }}>
                  {activity.icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {activity.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.time}
                  </Typography>
                </Box>
                <Chip
                  label={activity.status}
                  size="small"
                  color={activity.status === 'completed' ? 'success' : 'default'}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);

const PerformanceChart = ({ data = [] }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        AI Performance Trends
      </Typography>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <RechartsTooltip />
          <Area
            type="monotone"
            dataKey="accuracy"
            stackId="1"
            stroke="#8B4513"
            fill="#8B4513"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="confidence"
            stackId="1"
            stroke="#FF6B35"
            fill="#FF6B35"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // State
  const [systemStatus, setSystemStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mock data for demonstration
  const [stats] = useState({
    totalReconstructions: 1247,
    accuracyRate: 87.3,
    avgConfidence: 82.1,
    activeUsers: 23,
  });
  
  const [recentActivities] = useState([
    {
      title: 'Manuscript reconstruction completed',
      time: '2 minutes ago',
      status: 'completed',
      icon: <AutoFixHigh sx={{ fontSize: 16 }} />,
    },
    {
      title: 'New Sanskrit text uploaded',
      time: '15 minutes ago',
      status: 'processing',
      icon: <Upload sx={{ fontSize: 16 }} />,
    },
    {
      title: 'Grammar analysis finished',
      time: '1 hour ago',
      status: 'completed',
      icon: <Psychology sx={{ fontSize: 16 }} />,
    },
  ]);
  
  const [performanceData] = useState([
    { time: '00:00', accuracy: 85, confidence: 78 },
    { time: '04:00', accuracy: 87, confidence: 81 },
    { time: '08:00', accuracy: 89, confidence: 84 },
    { time: '12:00', accuracy: 86, confidence: 79 },
    { time: '16:00', accuracy: 88, confidence: 83 },
    { time: '20:00', accuracy: 87, confidence: 82 },
  ]);
  
  // Load system status and metrics
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load system status
        const statusResponse = await healthAPI.getStatus();
        setSystemStatus(statusResponse.data);
        
        // Load metrics (mock for now)
        setMetrics({
          processingTime: { avg: 2.3, trend: -12 },
          userSatisfaction: 4.2,
          modelVersion: '1.0.0-intelligent',
        });
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Quick actions
  const quickActions = [
    {
      title: 'Upload Manuscript',
      description: 'Start a new reconstruction project',
      icon: <CloudUpload sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/upload'),
      color: 'primary',
    },
    {
      title: 'Reconstruction Workspace',
      description: 'Continue working on existing projects',
      icon: <AutoFixHigh sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/workspace'),
      color: 'secondary',
    },
    {
      title: 'Knowledge Graph',
      description: 'Explore Paninian grammar rules',
      icon: <Psychology sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/knowledge-graph'),
      color: 'info',
    },
    {
      title: 'AI Assistant',
      description: 'Get help with Sanskrit grammar',
      icon: <School sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/assistant'),
      color: 'success',
    },
  ];
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading intelligent dashboard...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Sanskrit Manuscript Portal
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Intelligent AI-powered reconstruction and analysis
        </Typography>
        
        {/* System status */}
        {systemStatus && (
          <Alert
            severity={systemStatus.api_gateway === 'healthy' ? 'success' : 'warning'}
            sx={{ mt: 2 }}
          >
            System Status: {systemStatus.api_gateway} • 
            Active Sessions: {systemStatus.active_sessions} • 
            WebSocket Connections: {systemStatus.websocket_connections}
          </Alert>
        )}
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reconstructions"
            value={stats.totalReconstructions.toLocaleString()}
            subtitle="Total processed"
            icon={<AutoFixHigh />}
            color="primary"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Accuracy Rate"
            value={`${stats.accuracyRate}%`}
            subtitle="AI model accuracy"
            icon={<CheckCircle />}
            color="success"
            trend={3.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Confidence"
            value={`${stats.avgConfidence}%`}
            subtitle="Model confidence"
            icon={<Timeline />}
            color="info"
            trend={-1.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processing Speed"
            value="2.3s"
            subtitle="Average time"
            icon={<Speed />}
            color="secondary"
            trend={-8}
          />
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <PerformanceChart data={performanceData} />
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <RecentActivity activities={recentActivities} />
        </Grid>
        
        {/* AI Features Showcase */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🧠 Intelligent AI Features
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'primary.main', width: 32, height: 32 }}>
                    <Memory sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Episodic Memory
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Learns from similar reconstruction cases
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'secondary.main', width: 32, height: 32 }}>
                    <Timeline sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Uncertainty Quantification
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Provides confidence estimates for predictions
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'success.main', width: 32, height: 32 }}>
                    <Psychology sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Grammar-Aware Generation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Applies Paninian rules with learned preferences
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: 'info.main', width: 32, height: 32 }}>
                    <AutoFixHigh sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Multi-Strategy Generation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Conservative, creative, and memory-guided approaches
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              
              {systemStatus && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      API Gateway
                    </Typography>
                    <Chip
                      label={systemStatus.api_gateway}
                      color={systemStatus.api_gateway === 'healthy' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Services Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(systemStatus.services || {}).map(([service, status]) => (
                        <Chip
                          key={service}
                          label={`${service}: ${status}`}
                          color={status === 'healthy' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Version
                    </Typography>
                    <Typography variant="body1">
                      {systemStatus.version}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Getting Started */}
      <Paper
        sx={{
          mt: 4,
          p: 3,
          background: 'linear-gradient(135deg, #FFF8E7 0%, #F5F5DC 100%)',
          border: '1px solid',
          borderColor: 'primary.light',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Star sx={{ color: 'primary.main' }} />
          <Typography variant="h6" color="primary.main">
            Getting Started with Intelligent Reconstruction
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Welcome to the most advanced Sanskrit manuscript reconstruction system! 
          Our AI combines deep learning with traditional Paninian grammar to provide 
          accurate, contextually-aware reconstructions.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/upload')}
          >
            Start Your First Reconstruction
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<School />}
            onClick={() => navigate('/assistant')}
          >
            Learn with AI Assistant
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
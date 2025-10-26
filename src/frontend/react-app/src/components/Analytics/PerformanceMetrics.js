import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Speed,
  Memory,
  TrendingUp,
  Timer,
} from '@mui/icons-material';

const PerformanceMetrics = ({ 
  timings = {}, 
  compact = false 
}) => {
  const {
    total_ms = 0,
    model_inference_ms = 0,
    kg_lookup_ms = 0,
    ocr_processing_ms = 0,
  } = timings;
  
  const metrics = [
    {
      label: 'Total Time',
      value: total_ms,
      unit: 'ms',
      icon: <Timer />,
      color: 'primary',
    },
    {
      label: 'Model Inference',
      value: model_inference_ms,
      unit: 'ms',
      icon: <Memory />,
      color: 'secondary',
    },
    {
      label: 'KG Lookup',
      value: kg_lookup_ms,
      unit: 'ms',
      icon: <Speed />,
      color: 'info',
    },
  ];
  
  if (compact) {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Performance
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {metrics.map((metric) => (
            <Box key={metric.label} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={`${metric.color}.main`}>
                {Math.round(metric.value)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Metrics
        </Typography>
        
        <Grid container spacing={2}>
          {metrics.map((metric) => (
            <Grid item xs={12} sm={4} key={metric.label}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {metric.icon}
                  <Typography variant="h5" sx={{ ml: 1 }} color={`${metric.color}.main`}>
                    {Math.round(metric.value)}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {metric.unit}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                
                {/* Performance indicator */}
                <LinearProgress
                  variant="determinate"
                  value={Math.min((metric.value / (total_ms || 1)) * 100, 100)}
                  color={metric.color}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
        
        {/* Performance summary */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Chip
            icon={<TrendingUp />}
            label={total_ms < 3000 ? 'Fast' : total_ms < 5000 ? 'Normal' : 'Slow'}
            color={total_ms < 3000 ? 'success' : total_ms < 5000 ? 'warning' : 'error'}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
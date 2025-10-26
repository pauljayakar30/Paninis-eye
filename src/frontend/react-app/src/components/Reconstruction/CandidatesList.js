import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Collapse,
  Alert,
  Rating,
  Badge,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
  Psychology,
  Translate,
  Timeline,
  AutoFixHigh,
  Lightbulb,
  School,
  Memory,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha } from '@mui/material/styles';

import { 
  acceptCandidate, 
  rejectCandidate, 
  addUserCorrection 
} from '../../store/slices/reconstructionSlice';

const CandidateCard = ({ 
  candidate, 
  index, 
  isSelected, 
  onSelect, 
  showConfidence = true,
  showGrammarScore = true,
  realtimeMode = false 
}) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  const {
    candidate_id,
    sanskrit_text,
    iast,
    morph_seg,
    sutras,
    literal_gloss,
    idiomatic_translation,
    scores,
    uncertainty_scores,
    generation_strategy,
  } = candidate;
  
  // Handle accept/reject
  const handleAccept = (e) => {
    e.stopPropagation();
    dispatch(acceptCandidate(candidate));
  };
  
  const handleReject = (e) => {
    e.stopPropagation();
    dispatch(rejectCandidate(candidate));
  };
  
  // Handle user rating
  const handleRatingChange = (event, newValue) => {
    setUserRating(newValue);
    dispatch(addUserCorrection({
      candidate_id,
      user_rating: newValue,
      feedback_type: 'rating',
    }));
  };
  
  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };
  
  // Get strategy icon and color
  const getStrategyInfo = (strategy) => {
    switch (strategy) {
      case 'conservative':
        return { icon: <CheckCircle />, color: 'success', label: 'Conservative' };
      case 'creative':
        return { icon: <Lightbulb />, color: 'secondary', label: 'Creative' };
      case 'memory_guided':
        return { icon: <Memory />, color: 'info', label: 'Memory-Guided' };
      default:
        return { icon: <AutoFixHigh />, color: 'primary', label: 'Standard' };
    }
  };
  
  const strategyInfo = getStrategyInfo(generation_strategy);
  const combinedScore = scores?.combined || 0;
  const confidence = uncertainty_scores?.confidence || scores?.model_confidence || 0;
  const grammarScore = scores?.grammar_score || scores?.kg_compliance || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          mb: 2,
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          backgroundColor: isSelected 
            ? alpha('#8B4513', 0.05) 
            : 'background.paper',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            borderColor: 'primary.light',
          },
        }}
        onClick={() => onSelect(candidate)}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Typography variant="h6" component="div">
                Candidate {index + 1}
              </Typography>
              
              {/* Strategy badge */}
              <Chip
                icon={strategyInfo.icon}
                label={strategyInfo.label}
                size="small"
                color={strategyInfo.color}
                variant="outlined"
              />
              
              {/* Rank badge */}
              {index === 0 && (
                <Chip
                  label="Best"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
            
            {/* Combined score */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary">
                {Math.round(combinedScore * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Score
              </Typography>
            </Box>
          </Box>
          
          {/* Sanskrit text */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: '"Noto Sans Devanagari", serif',
                lineHeight: 1.6,
                color: 'text.primary',
                mb: 1,
              }}
            >
              {sanskrit_text}
            </Typography>
            
            {/* IAST transliteration */}
            <Typography 
              variant="body1" 
              sx={{ 
                fontStyle: 'italic',
                color: 'text.secondary',
                mb: 1,
              }}
            >
              {iast}
            </Typography>
            
            {/* Morphological segmentation */}
            {morph_seg && morph_seg.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {morph_seg.map((segment, idx) => (
                  <Chip
                    key={idx}
                    label={segment}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            )}
          </Box>
          
          {/* Confidence metrics */}
          {showConfidence && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Model Confidence
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={confidence * 100}
                    color={getConfidenceColor(confidence)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(confidence * 100)}%
                </Typography>
              </Box>
              
              {showGrammarScore && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Grammar Compliance
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={grammarScore * 100}
                      color={getConfidenceColor(grammarScore)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(grammarScore * 100)}%
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          {/* Quick translations */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Literal:</strong> {literal_gloss}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Idiomatic:</strong> {idiomatic_translation}
            </Typography>
          </Box>
          
          {/* User rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2">Rate this candidate:</Typography>
            <Rating
              value={userRating}
              onChange={handleRatingChange}
              size="small"
            />
          </Box>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle />}
              onClick={handleAccept}
            >
              Accept
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Cancel />}
              onClick={handleReject}
            >
              Reject
            </Button>
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Expand button */}
            <Tooltip title={expanded ? "Show less" : "Show more details"}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                size="small"
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Expanded details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            
            {/* Applicable sutras */}
            {sutras && sutras.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <Psychology sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Applicable Grammar Rules
                </Typography>
                {sutras.map((sutra, idx) => (
                  <Alert
                    key={idx}
                    severity="info"
                    variant="outlined"
                    sx={{ mb: 1, fontSize: '0.875rem' }}
                  >
                    <Typography variant="body2">
                      <strong>{sutra.id}:</strong> {sutra.description || sutra.text}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}
            
            {/* Uncertainty breakdown */}
            {uncertainty_scores && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <Timeline sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Uncertainty Analysis
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant="caption">Epistemic (Model)</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(1 - uncertainty_scores.epistemic_uncertainty) * 100}
                      color="info"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption">Aleatoric (Data)</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(1 - uncertainty_scores.aleatoric_uncertainty) * 100}
                      color="warning"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
            
            {/* Detailed scores */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detailed Scores
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
                {Object.entries(scores || {}).map(([key, value]) => (
                  <Box key={key} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {key.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(value * 100)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CandidatesList = ({ 
  candidates = [], 
  selectedCandidate, 
  onCandidateSelect,
  showConfidence = true,
  showGrammarScore = true,
  realtimeMode = false 
}) => {
  const [sortBy, setSortBy] = useState('combined_score');
  const [filterStrategy, setFilterStrategy] = useState('all');
  
  // Sort candidates
  const sortedCandidates = [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return (b.scores?.model_confidence || 0) - (a.scores?.model_confidence || 0);
      case 'grammar':
        return (b.scores?.grammar_score || 0) - (a.scores?.grammar_score || 0);
      case 'combined_score':
      default:
        return (b.scores?.combined || 0) - (a.scores?.combined || 0);
    }
  });
  
  // Filter by strategy
  const filteredCandidates = filterStrategy === 'all' 
    ? sortedCandidates
    : sortedCandidates.filter(c => c.generation_strategy === filterStrategy);
  
  if (candidates.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: 'text.secondary',
        }}
      >
        <AutoFixHigh sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No Reconstruction Candidates
        </Typography>
        <Typography variant="body2" textAlign="center">
          Select damaged regions and click "Reconstruct" to generate intelligent candidates
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header with controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reconstruction Candidates ({candidates.length})
        </Typography>
        
        {realtimeMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Realtime mode is active. Candidates will update automatically as you modify selections.
            </Typography>
          </Alert>
        )}
        
        {/* Sort and filter controls */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="By Score"
            variant={sortBy === 'combined_score' ? 'filled' : 'outlined'}
            onClick={() => setSortBy('combined_score')}
            size="small"
          />
          <Chip
            label="By Confidence"
            variant={sortBy === 'confidence' ? 'filled' : 'outlined'}
            onClick={() => setSortBy('confidence')}
            size="small"
          />
          <Chip
            label="By Grammar"
            variant={sortBy === 'grammar' ? 'filled' : 'outlined'}
            onClick={() => setSortBy('grammar')}
            size="small"
          />
        </Box>
      </Box>
      
      {/* Candidates list */}
      <AnimatePresence>
        {filteredCandidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.candidate_id}
            candidate={candidate}
            index={index}
            isSelected={selectedCandidate?.candidate_id === candidate.candidate_id}
            onSelect={onCandidateSelect}
            showConfidence={showConfidence}
            showGrammarScore={showGrammarScore}
            realtimeMode={realtimeMode}
          />
        ))}
      </AnimatePresence>
      
      {/* Summary */}
      {candidates.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Generation Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              <strong>Best Score:</strong> {Math.round((candidates[0]?.scores?.combined || 0) * 100)}%
            </Typography>
            <Typography variant="body2">
              <strong>Avg Confidence:</strong> {Math.round(
                candidates.reduce((sum, c) => sum + (c.scores?.model_confidence || 0), 0) / candidates.length * 100
              )}%
            </Typography>
            <Typography variant="body2">
              <strong>Strategies:</strong> {
                [...new Set(candidates.map(c => c.generation_strategy))].join(', ')
              }
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CandidatesList;
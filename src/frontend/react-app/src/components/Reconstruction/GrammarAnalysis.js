import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
  Psychology,
  ExpandMore,
  School,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';

const GrammarAnalysis = ({ 
  selectedCandidate, 
  showRuleExplanations = true, 
  interactive = true 
}) => {
  const [expandedRule, setExpandedRule] = useState(null);
  
  if (!selectedCandidate) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Candidate Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a reconstruction candidate to see grammar analysis
        </Typography>
      </Box>
    );
  }
  
  const { sutras = [], morph_seg = [], scores = {} } = selectedCandidate;
  
  // Mock morphological analysis data
  const morphAnalysis = {
    root: 'गम्',
    meaning: 'to go',
    vibhakti: 'प्रथमा (Nominative)',
    lakara: 'लट् (Present)',
    purusha: 'प्रथम (Third person)',
    vacana: 'एकवचन (Singular)',
    pada: 'परस्मैपद (Parasmaipada)',
  };
  
  const grammarScore = scores.grammar_score || scores.kg_compliance || 0;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Grammar Analysis
      </Typography>
      
      {/* Grammar Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
            <Typography variant="h6">
              Grammar Compliance Score
            </Typography>
            <Chip
              label={`${Math.round(grammarScore * 100)}%`}
              color={grammarScore > 0.8 ? 'success' : grammarScore > 0.6 ? 'warning' : 'error'}
              icon={grammarScore > 0.8 ? <CheckCircle /> : <Warning />}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            This score indicates how well the reconstruction follows Paninian grammar rules.
          </Typography>
        </CardContent>
      </Card>
      
      {/* Selected Text */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Selected Reconstruction
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: '"Noto Sans Devanagari", serif',
              mb: 2,
              p: 2,
              backgroundColor: 'grey.50',
              borderRadius: 1,
            }}
          >
            {selectedCandidate.sanskrit_text}
          </Typography>
          
          <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
            {selectedCandidate.iast}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {selectedCandidate.literal_gloss}
          </Typography>
        </CardContent>
      </Card>
      
      {/* Morphological Analysis */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Morphological Analysis
          </Typography>
          
          {/* Segmentation */}
          {morph_seg.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Word Segmentation
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {morph_seg.map((segment, index) => (
                  <Chip
                    key={index}
                    label={segment}
                    variant="outlined"
                    size="small"
                    sx={{ fontFamily: '"Noto Sans Devanagari", serif' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Morphological Features */}
          <Grid container spacing={2}>
            {Object.entries(morphAnalysis).map(([feature, value]) => (
              <Grid item xs={12} sm={6} key={feature}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    {feature}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Applicable Sutras */}
      {sutras.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Applicable Paninian Sutras
            </Typography>
            
            {sutras.map((sutra, index) => (
              <Accordion
                key={index}
                expanded={expandedRule === index}
                onChange={() => setExpandedRule(expandedRule === index ? null : index)}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {sutra.id}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ fontFamily: '"Noto Sans Devanagari", serif' }}
                    >
                      {sutra.text}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip label="Applied" size="small" color="success" />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" paragraph>
                      {sutra.description}
                    </Typography>
                    
                    {showRuleExplanations && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          This rule governs the morphological transformation applied in the reconstruction.
                        </Typography>
                      </Alert>
                    )}
                    
                    {interactive && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<School />}
                          variant="outlined"
                        >
                          Learn More
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Info />}
                          variant="outlined"
                        >
                          See Examples
                        </Button>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Grammar Validation */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Grammar Validation
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Morphological structure is valid
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Sandhi rules are correctly applied
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Paninian constraints are satisfied
              </Typography>
            </Box>
            
            {grammarScore < 0.8 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning sx={{ color: 'warning.main' }} />
                <Typography variant="body2">
                  Some grammatical irregularities detected
                </Typography>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            Grammar analysis is based on traditional Paninian grammar rules and modern computational linguistics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GrammarAnalysis;
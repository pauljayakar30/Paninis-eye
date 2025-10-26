import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Translate,
  VolumeUp,
  ContentCopy,
  Share,
  Edit,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { translateText } from '../../store/slices/reconstructionSlice';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translation-tabpanel-${index}`}
      aria-labelledby={`translation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const TranslationPanel = ({ 
  selectedCandidate, 
  showAlignment = true, 
  showConfidence = true 
}) => {
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState(0);
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Generate translations when candidate changes
  useEffect(() => {
    if (selectedCandidate) {
      generateTranslations();
    }
  }, [selectedCandidate]);
  
  const generateTranslations = async () => {
    if (!selectedCandidate) return;
    
    setIsTranslating(true);
    
    try {
      // Generate both literal and idiomatic translations
      const literalPromise = dispatch(translateText({
        text: selectedCandidate.sanskrit_text,
        style: 'literal'
      }));
      
      const idiomaticPromise = dispatch(translateText({
        text: selectedCandidate.sanskrit_text,
        style: 'idiomatic'
      }));
      
      const [literalResult, idiomaticResult] = await Promise.all([
        literalPromise,
        idiomaticPromise
      ]);
      
      setTranslations({
        literal: literalResult.payload || {
          translation: selectedCandidate.literal_gloss,
          confidence: 0.8,
          alignment: []
        },
        idiomatic: idiomaticResult.payload || {
          translation: selectedCandidate.idiomatic_translation,
          confidence: 0.75,
          alignment: []
        }
      });
      
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback to candidate translations
      setTranslations({
        literal: {
          translation: selectedCandidate.literal_gloss,
          confidence: 0.8,
          alignment: []
        },
        idiomatic: {
          translation: selectedCandidate.idiomatic_translation,
          confidence: 0.75,
          alignment: []
        }
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleCopyTranslation = (translation) => {
    navigator.clipboard.writeText(translation);
    toast.success('Translation copied to clipboard!');
  };
  
  const handlePlayAudio = (text, language = 'en') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'sanskrit' ? 'hi-IN' : 'en-US';
      speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };
  
  if (!selectedCandidate) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Translate sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Candidate Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a reconstruction candidate to see translations
        </Typography>
      </Box>
    );
  }
  
  const literalTranslation = translations.literal || {};
  const idiomaticTranslation = translations.idiomatic || {};
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Translation Analysis
      </Typography>
      
      {/* Source Text */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Sanskrit Text
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: '"Noto Sans Devanagari", serif',
                flexGrow: 1,
              }}
            >
              {selectedCandidate.sanskrit_text}
            </Typography>
            
            <Tooltip title="Play Sanskrit pronunciation">
              <IconButton 
                onClick={() => handlePlayAudio(selectedCandidate.sanskrit_text, 'sanskrit')}
                size="small"
              >
                <VolumeUp />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {selectedCandidate.iast}
          </Typography>
        </CardContent>
      </Card>
      
      {/* Translation Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              label="Literal Translation" 
              icon={<Translate />} 
              iconPosition="start"
            />
            <Tab 
              label="Idiomatic Translation" 
              icon={<Edit />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <CardContent>
          {isTranslating && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Generating intelligent translations...
              </Typography>
            </Box>
          )}
          
          <AnimatePresence mode="wait">
            <TabPanel value={activeTab} index={0}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TranslationContent
                  translation={literalTranslation}
                  type="Literal"
                  description="Word-for-word translation preserving grammatical structure"
                  showAlignment={showAlignment}
                  showConfidence={showConfidence}
                  onCopy={handleCopyTranslation}
                  onPlay={handlePlayAudio}
                />
              </motion.div>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TranslationContent
                  translation={idiomaticTranslation}
                  type="Idiomatic"
                  description="Natural English translation with cultural context"
                  showAlignment={showAlignment}
                  showConfidence={showConfidence}
                  onCopy={handleCopyTranslation}
                  onPlay={handlePlayAudio}
                />
              </motion.div>
            </TabPanel>
          </AnimatePresence>
        </CardContent>
      </Card>
    </Box>
  );
};

const TranslationContent = ({ 
  translation, 
  type, 
  description, 
  showAlignment, 
  showConfidence, 
  onCopy, 
  onPlay 
}) => {
  const translationText = translation.translation || `${type} translation not available`;
  const confidence = translation.confidence || 0;
  const alignment = translation.alignment || [];
  
  return (
    <Box>
      {/* Translation Text */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 1 }}>
          <Typography variant="subtitle1">
            {type} Translation
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy translation">
              <IconButton 
                onClick={() => onCopy(translationText)}
                size="small"
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Play translation">
              <IconButton 
                onClick={() => onPlay(translationText)}
                size="small"
              >
                <VolumeUp />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share translation">
              <IconButton size="small">
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography 
          variant="h6" 
          sx={{ 
            p: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: 1,
            borderLeft: 4,
            borderColor: 'primary.main',
            mb: 1,
          }}
        >
          "{translationText}"
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      
      {/* Confidence Score */}
      {showConfidence && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 1 }}>
            <Typography variant="body2">
              Translation Confidence
            </Typography>
            <Chip
              label={`${Math.round(confidence * 100)}%`}
              size="small"
              color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={confidence * 100}
            color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      
      {/* Word Alignment */}
      {showAlignment && alignment.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Word Alignment
          </Typography>
          
          <Grid container spacing={1}>
            {alignment.map((pair, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ fontFamily: '"Noto Sans Devanagari", serif' }}
                  >
                    {pair.sanskrit}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ↓
                  </Typography>
                  <Typography variant="body2">
                    {pair.english}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Translation Notes */}
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Translation Note:</strong> This {type.toLowerCase()} translation is generated by our 
          AI model trained on Sanskrit-English parallel corpora. Cultural and contextual nuances 
          may require human expertise for scholarly work.
        </Typography>
      </Alert>
    </Box>
  );
};

export default TranslationPanel;
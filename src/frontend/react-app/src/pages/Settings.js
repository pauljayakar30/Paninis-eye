import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Psychology,
  Speed,
  Palette,
  VolumeUp,
  Security,
  Save,
  RestoreFromTrash,
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    // AI Model Settings
    reconstructionMode: 'hard',
    nCandidates: 5,
    temperature: 0.8,
    enableUncertainty: true,
    enableMemory: true,
    enableMultiModal: true,
    
    // UI Settings
    theme: 'light',
    language: 'en',
    showTooltips: true,
    enableAnimations: true,
    compactMode: false,
    autoSave: true,
    
    // Performance Settings
    maxProcessingTime: 30,
    enableGPU: true,
    batchSize: 8,
    cacheResults: true,
    
    // Audio Settings
    enableTTS: true,
    ttsLanguage: 'en-US',
    ttsSpeed: 1.0,
    
    // Privacy Settings
    collectAnalytics: true,
    shareImprovements: true,
    storeHistory: true,
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };
  
  const handleReset = () => {
    // Reset to defaults
    setHasChanges(false);
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings & Preferences
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your Sanskrit reconstruction experience
        </Typography>
      </Box>
      
      {/* Save Alert */}
      {hasChanges && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleSave}>
                Save
              </Button>
              <Button color="inherit" size="small" onClick={handleReset}>
                Cancel
              </Button>
            </Box>
          }
        >
          You have unsaved changes
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* AI Model Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Model Settings
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Reconstruction Mode */}
                <FormControl fullWidth>
                  <InputLabel>Reconstruction Mode</InputLabel>
                  <Select
                    value={settings.reconstructionMode}
                    label="Reconstruction Mode"
                    onChange={(e) => handleSettingChange('reconstructionMode', e.target.value)}
                  >
                    <MenuItem value="soft">Soft Constraints</MenuItem>
                    <MenuItem value="hard">Hard Constraints</MenuItem>
                    <MenuItem value="adaptive">Adaptive</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Number of Candidates */}
                <Box>
                  <Typography gutterBottom>
                    Number of Candidates: {settings.nCandidates}
                  </Typography>
                  <Slider
                    value={settings.nCandidates}
                    onChange={(e, value) => handleSettingChange('nCandidates', value)}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                {/* Temperature */}
                <Box>
                  <Typography gutterBottom>
                    Generation Temperature: {settings.temperature}
                  </Typography>
                  <Slider
                    value={settings.temperature}
                    onChange={(e, value) => handleSettingChange('temperature', value)}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                {/* AI Features */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Features
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableUncertainty}
                        onChange={(e) => handleSettingChange('enableUncertainty', e.target.checked)}
                      />
                    }
                    label="Uncertainty Quantification"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableMemory}
                        onChange={(e) => handleSettingChange('enableMemory', e.target.checked)}
                      />
                    }
                    label="Episodic Memory"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableMultiModal}
                        onChange={(e) => handleSettingChange('enableMultiModal', e.target.checked)}
                      />
                    }
                    label="Multi-Modal Processing"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* UI Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                User Interface
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Theme */}
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.theme}
                    label="Theme"
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Language */}
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.language}
                    label="Language"
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">हिन्दी</MenuItem>
                    <MenuItem value="sa">संस्कृत</MenuItem>
                  </Select>
                </FormControl>
                
                {/* UI Options */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Interface Options
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showTooltips}
                        onChange={(e) => handleSettingChange('showTooltips', e.target.checked)}
                      />
                    }
                    label="Show Tooltips"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableAnimations}
                        onChange={(e) => handleSettingChange('enableAnimations', e.target.checked)}
                      />
                    }
                    label="Enable Animations"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.compactMode}
                        onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                      />
                    }
                    label="Compact Mode"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoSave}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                      />
                    }
                    label="Auto-save Work"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Performance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Max Processing Time */}
                <Box>
                  <Typography gutterBottom>
                    Max Processing Time: {settings.maxProcessingTime}s
                  </Typography>
                  <Slider
                    value={settings.maxProcessingTime}
                    onChange={(e, value) => handleSettingChange('maxProcessingTime', value)}
                    min={10}
                    max={120}
                    step={5}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                {/* Batch Size */}
                <Box>
                  <Typography gutterBottom>
                    Batch Size: {settings.batchSize}
                  </Typography>
                  <Slider
                    value={settings.batchSize}
                    onChange={(e, value) => handleSettingChange('batchSize', value)}
                    min={1}
                    max={32}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 8, label: '8' },
                      { value: 16, label: '16' },
                      { value: 32, label: '32' },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                {/* Performance Options */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Options
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableGPU}
                        onChange={(e) => handleSettingChange('enableGPU', e.target.checked)}
                      />
                    }
                    label="Enable GPU Acceleration"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cacheResults}
                        onChange={(e) => handleSettingChange('cacheResults', e.target.checked)}
                      />
                    }
                    label="Cache Results"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Audio Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Audio & Speech
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* TTS Language */}
                <FormControl fullWidth>
                  <InputLabel>TTS Language</InputLabel>
                  <Select
                    value={settings.ttsLanguage}
                    label="TTS Language"
                    onChange={(e) => handleSettingChange('ttsLanguage', e.target.value)}
                    disabled={!settings.enableTTS}
                  >
                    <MenuItem value="en-US">English (US)</MenuItem>
                    <MenuItem value="en-GB">English (UK)</MenuItem>
                    <MenuItem value="hi-IN">Hindi</MenuItem>
                  </Select>
                </FormControl>
                
                {/* TTS Speed */}
                <Box>
                  <Typography gutterBottom>
                    Speech Speed: {settings.ttsSpeed}x
                  </Typography>
                  <Slider
                    value={settings.ttsSpeed}
                    onChange={(e, value) => handleSettingChange('ttsSpeed', value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    disabled={!settings.enableTTS}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                {/* Audio Options */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableTTS}
                      onChange={(e) => handleSettingChange('enableTTS', e.target.checked)}
                    />
                  }
                  label="Enable Text-to-Speech"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Privacy Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Privacy & Data
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.collectAnalytics}
                        onChange={(e) => handleSettingChange('collectAnalytics', e.target.checked)}
                      />
                    }
                    label="Collect Usage Analytics"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Help improve the system by sharing anonymous usage data
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.shareImprovements}
                        onChange={(e) => handleSettingChange('shareImprovements', e.target.checked)}
                      />
                    }
                    label="Share Model Improvements"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Contribute to AI model improvements through federated learning
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.storeHistory}
                        onChange={(e) => handleSettingChange('storeHistory', e.target.checked)}
                      />
                    }
                    label="Store Reconstruction History"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Keep a local history of your reconstruction sessions
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<RestoreFromTrash />}
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
        
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Settings
        </Button>
      </Box>
      
      {/* System Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
              <Chip label="v1.0.0-intelligent" size="small" />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Model
              </Typography>
              <Chip label="PaniniT5-Large" size="small" color="primary" />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                KG Version
              </Typography>
              <Chip label="PG-KG v2.1" size="small" color="secondary" />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
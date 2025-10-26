import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Psychology,
  Search,
  AccountTree,
  MenuBook,
  School,
  Visibility,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  FilterList,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kg-tabpanel-${index}`}
      aria-labelledby={`kg-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const KnowledgeGraph = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterType, setFilterType] = useState('all');
  
  // Mock knowledge graph data
  const [kgData] = useState({
    nodes: [
      {
        id: 'sutra_6.1.87',
        type: 'sutra',
        text: 'आद्गुणः',
        description: 'The vowels a, i, u are replaced by their corresponding guṇa vowels',
        adhyaya: 6,
        pada: 1,
        sutra_num: 87,
        connections: 15,
        examples: ['अ + इ = ए', 'अ + उ = ओ'],
      },
      {
        id: 'sutra_6.1.101',
        type: 'sutra',
        text: 'अकः सवर्णे दीर्घः',
        description: 'When a vowel is followed by a similar vowel, they combine to form the long vowel',
        adhyaya: 6,
        pada: 1,
        sutra_num: 101,
        connections: 12,
        examples: ['राम + आगच्छति = रामागच्छति'],
      },
      {
        id: 'concept_sandhi',
        type: 'concept',
        text: 'Sandhi',
        description: 'Rules governing sound changes when words are combined',
        connections: 25,
        subcategories: ['Vowel Sandhi', 'Consonant Sandhi', 'Visarga Sandhi'],
      },
      {
        id: 'dhatu_gam',
        type: 'dhatu',
        text: 'गम्',
        description: 'Root meaning "to go"',
        gana: 1,
        meaning: 'to go, to move',
        connections: 8,
        forms: ['गच्छति', 'गतः', 'गमिष्यति'],
      },
      {
        id: 'vibhakti_prathama',
        type: 'vibhakti',
        text: 'प्रथमा विभक्ति',
        description: 'Nominative case - subject of the sentence',
        case_num: 1,
        connections: 20,
        endings: {
          masculine: ['ः', 'ौ', 'े'],
          feminine: ['', 'े', 'ाः'],
          neuter: ['म्', 'े', 'ानि']
        },
      },
    ],
    relationships: [
      { source: 'sutra_6.1.87', target: 'concept_sandhi', type: 'governs' },
      { source: 'sutra_6.1.101', target: 'concept_sandhi', type: 'governs' },
      { source: 'dhatu_gam', target: 'vibhakti_prathama', type: 'takes' },
    ],
    stats: {
      totalNodes: 2847,
      totalRelationships: 5692,
      sutras: 3959,
      concepts: 156,
      dhatus: 2000,
      vibhaktis: 8,
    }
  });
  
  const [searchResults, setSearchResults] = useState([]);
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = kgData.nodes.filter(node =>
      node.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
  };
  
  // Filter nodes by type
  const getFilteredNodes = () => {
    if (filterType === 'all') return kgData.nodes;
    return kgData.nodes.filter(node => node.type === filterType);
  };
  
  const nodeTypes = [
    { key: 'all', label: 'All', icon: <AccountTree />, color: 'primary' },
    { key: 'sutra', label: 'Sutras', icon: <MenuBook />, color: 'secondary' },
    { key: 'concept', label: 'Concepts', icon: <Psychology />, color: 'info' },
    { key: 'dhatu', label: 'Roots', icon: <School />, color: 'success' },
    { key: 'vibhakti', label: 'Cases', icon: <Visibility />, color: 'warning' },
  ];
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Paninian Grammar Knowledge Graph
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore the interconnected world of Sanskrit grammar rules and concepts
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {kgData.stats.totalNodes.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Nodes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="secondary">
                {kgData.stats.sutras.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sutras
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {kgData.stats.dhatus.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Dhatus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {kgData.stats.totalRelationships.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Relationships
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search sutras, concepts, dhatus, or rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ minWidth: 100 }}
              >
                Search
              </Button>
            </Box>
          </Paper>
          
          {/* Graph Visualization Placeholder */}
          <Paper
            sx={{
              height: 400,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
              border: '2px dashed #ccc',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <AccountTree sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Interactive Knowledge Graph
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                3D visualization of Paninian grammar relationships
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Tooltip title="Zoom in">
                  <IconButton>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom out">
                  <IconButton>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Center view">
                  <IconButton>
                    <CenterFocusStrong />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {searchResults.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onClick={() => setSelectedNode(node)}
                    isSelected={selectedNode?.id === node.id}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Node Type Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                Node Types
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {nodeTypes.map((type) => (
                  <Button
                    key={type.key}
                    variant={filterType === type.key ? 'contained' : 'outlined'}
                    color={type.color}
                    startIcon={type.icon}
                    onClick={() => setFilterType(type.key)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {type.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
          
          {/* Selected Node Details */}
          {selectedNode ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Node Details
                </Typography>
                
                <NodeDetails node={selectedNode} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Featured Nodes
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {getFilteredNodes().slice(0, 3).map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      onClick={() => setSelectedNode(node)}
                      compact
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

const NodeCard = ({ node, onClick, isSelected = false, compact = false }) => {
  const getNodeIcon = (type) => {
    switch (type) {
      case 'sutra': return <MenuBook />;
      case 'concept': return <Psychology />;
      case 'dhatu': return <School />;
      case 'vibhakti': return <Visibility />;
      default: return <AccountTree />;
    }
  };
  
  const getNodeColor = (type) => {
    switch (type) {
      case 'sutra': return 'secondary';
      case 'concept': return 'info';
      case 'dhatu': return 'success';
      case 'vibhakti': return 'warning';
      default: return 'primary';
    }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          '&:hover': {
            boxShadow: 2,
            borderColor: 'primary.light',
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ py: compact ? 1 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Chip
              icon={getNodeIcon(node.type)}
              label={node.type}
              size="small"
              color={getNodeColor(node.type)}
            />
            <Typography variant="caption" color="text.secondary">
              {node.connections} connections
            </Typography>
          </Box>
          
          <Typography 
            variant={compact ? "body2" : "h6"} 
            sx={{ 
              fontFamily: node.text.match(/[\u0900-\u097F]/) ? '"Noto Sans Devanagari", serif' : 'inherit',
              mb: 1,
            }}
          >
            {node.text}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {node.description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const NodeDetails = ({ node }) => {
  return (
    <Box>
      {/* Node Header */}
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<MenuBook />}
          label={node.type.toUpperCase()}
          color="primary"
          sx={{ mb: 2 }}
        />
        
        <Typography 
          variant="h5" 
          sx={{ 
            fontFamily: node.text.match(/[\u0900-\u097F]/) ? '"Noto Sans Devanagari", serif' : 'inherit',
            mb: 1,
          }}
        >
          {node.text}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {node.description}
        </Typography>
      </Box>
      
      {/* Type-specific details */}
      {node.type === 'sutra' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sutra Details
          </Typography>
          <Typography variant="body2">
            Adhyaya: {node.adhyaya} | Pada: {node.pada} | Sutra: {node.sutra_num}
          </Typography>
          
          {node.examples && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Examples
              </Typography>
              {node.examples.map((example, index) => (
                <Typography 
                  key={index}
                  variant="body2" 
                  sx={{ 
                    fontFamily: '"Noto Sans Devanagari", serif',
                    backgroundColor: 'grey.50',
                    p: 1,
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  {example}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {node.type === 'dhatu' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Root Details
          </Typography>
          <Typography variant="body2">
            Gana: {node.gana} | Meaning: {node.meaning}
          </Typography>
          
          {node.forms && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Common Forms
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {node.forms.map((form, index) => (
                  <Chip
                    key={index}
                    label={form}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: '"Noto Sans Devanagari", serif' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      {node.type === 'vibhakti' && node.endings && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Case Endings
          </Typography>
          
          {Object.entries(node.endings).map(([gender, endings]) => (
            <Box key={gender} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {gender}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {endings.map((ending, index) => (
                  <Chip
                    key={index}
                    label={ending || '∅'}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: '"Noto Sans Devanagari", serif' }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Connections */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Connections
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This node has {node.connections} connections to other grammar concepts.
        </Typography>
      </Box>
    </Box>
  );
};

export default KnowledgeGraph;
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Upload,
  AutoFixHigh,
  Psychology,
  Translate,
  School,
  Analytics,
  Settings,
  Memory,
  Timeline,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/',
    description: 'Overview and quick actions',
  },
  {
    text: 'Upload Manuscript',
    icon: <Upload />,
    path: '/upload',
    description: 'Start new reconstruction',
  },
  {
    text: 'Reconstruction Workspace',
    icon: <AutoFixHigh />,
    path: '/workspace',
    description: 'AI-powered reconstruction',
    badge: 'AI',
  },
  {
    text: 'AI Restoration',
    icon: <Psychology />,
    path: '/gemini-restoration',
    description: 'Advanced AI restoration',
    badge: 'AI',
  },
  {
    text: 'Knowledge Graph',
    icon: <Psychology />,
    path: '/knowledge-graph',
    description: 'Explore Paninian rules',
  },
  {
    text: 'AI Assistant',
    icon: <School />,
    path: '/assistant',
    description: 'Interactive learning',
    badge: 'Smart',
  },
  {
    text: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
    description: 'Performance insights',
  },
];

const advancedFeatures = [
  {
    text: 'Episodic Memory',
    icon: <Memory />,
    path: '/memory',
    description: 'Case-based learning',
    badge: 'New',
  },
  {
    text: 'Uncertainty Analysis',
    icon: <Timeline />,
    path: '/uncertainty',
    description: 'Confidence metrics',
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #FFF8E7 0%, #F5F5DC 100%)',
          borderRight: '1px solid rgba(139, 69, 19, 0.12)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        {/* Main Navigation */}
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary" fontWeight="bold">
            Main Navigation
          </Typography>
        </Box>
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(139, 69, 19, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 69, 19, 0.16)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={isActive(item.path) ? 'bold' : 'normal'}>
                        {item.text}
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="primary"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={item.description}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ mx: 2, my: 2 }} />
        
        {/* Advanced Features */}
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary" fontWeight="bold">
            Advanced AI Features
          </Typography>
        </Box>
        
        <List>
          {advancedFeatures.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(139, 69, 19, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 69, 19, 0.16)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={isActive(item.path) ? 'bold' : 'normal'}>
                        {item.text}
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="secondary"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={item.description}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ mx: 2, my: 2 }} />
        
        {/* Settings */}
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/settings')}
              selected={isActive('/settings')}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(139, 69, 19, 0.12)',
                },
              }}
            >
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                secondary="Configure preferences"
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
        
        {/* Footer */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Intelligent Sanskrit AI
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            v1.0.0-intelligent
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
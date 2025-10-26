import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { 
  addStreamingResult, 
  setLivePreview,
  updateContextHistory,
} from '../store/slices/reconstructionSlice';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

const WebSocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const { sessionId } = useSelector(state => state.manuscript);
  
  // WebSocket connection management
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/${sessionId || 'default'}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Send initial handshake
      ws.send(JSON.stringify({
        type: 'handshake',
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect after a delay
      if (event.code !== 1000) { // Not a normal closure
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('reconnecting');
          connect();
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    wsRef.current = ws;
  };
  
  // Handle incoming messages
  const handleMessage = (data) => {
    switch (data.type) {
      case 'reconstruction_progress':
        handleReconstructionProgress(data);
        break;
        
      case 'streaming_candidate':
        handleStreamingCandidate(data);
        break;
        
      case 'live_preview':
        handleLivePreview(data);
        break;
        
      case 'context_update':
        handleContextUpdate(data);
        break;
        
      case 'assistant_response':
        handleAssistantResponse(data);
        break;
        
      case 'error':
        handleError(data);
        break;
        
      case 'notification':
        handleNotification(data);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };
  
  // Message handlers
  const handleReconstructionProgress = (data) => {
    const { progress, stage, message } = data;
    
    // Update progress in UI
    toast.loading(`${stage}: ${message}`, {
      id: 'reconstruction-progress',
      duration: progress >= 100 ? 2000 : Infinity,
    });
  };
  
  const handleStreamingCandidate = (data) => {
    const { candidate, isPartial } = data;
    
    if (isPartial) {
      // Update live preview
      dispatch(setLivePreview(candidate));
    } else {
      // Add complete candidate
      dispatch(addStreamingResult(candidate));
    }
  };
  
  const handleLivePreview = (data) => {
    const { preview } = data;
    dispatch(setLivePreview(preview));
  };
  
  const handleContextUpdate = (data) => {
    const { context } = data;
    dispatch(updateContextHistory(context));
  };
  
  const handleAssistantResponse = (data) => {
    // Handle assistant responses (will be implemented in assistant components)
    console.log('Assistant response:', data);
  };
  
  const handleError = (data) => {
    const { message, code } = data;
    toast.error(`Error ${code}: ${message}`);
  };
  
  const handleNotification = (data) => {
    const { message, type = 'info' } = data;
    
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'warning':
        toast.error(message, { icon: '⚠️' });
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast(message);
    }
  };
  
  // Send message
  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      }));
      return true;
    }
    return false;
  };
  
  // Specific message senders
  const sendReconstructionRequest = (data) => {
    return sendMessage({
      type: 'reconstruction_request',
      data,
    });
  };
  
  const sendMaskSelection = (maskIds) => {
    return sendMessage({
      type: 'mask_selection',
      maskIds,
    });
  };
  
  const sendUserFeedback = (feedback) => {
    return sendMessage({
      type: 'user_feedback',
      feedback,
    });
  };
  
  const sendAssistantQuery = (query, context) => {
    return sendMessage({
      type: 'assistant_query',
      query,
      context,
    });
  };
  
  // Connect when sessionId changes
  useEffect(() => {
    if (sessionId) {
      connect();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Provider unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  const value = {
    isConnected,
    connectionStatus,
    sendMessage,
    sendReconstructionRequest,
    sendMaskSelection,
    sendUserFeedback,
    sendAssistantQuery,
    connect,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
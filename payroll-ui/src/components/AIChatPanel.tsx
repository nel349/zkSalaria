import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Stack,
  Paper,
  LinearProgress,
  Button,
  Chip,
  CircularProgress,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useTheme, useThemeValues } from '../theme';
import { llmService } from '../services/LLMService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string; // Chain-of-thought reasoning from Qwen 3
  answer?: string;    // Actual answer (parsed from full response)
}

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * AI Chat Panel with WebLLM Integration
 * Slides in from the right side with streaming responses
 */
export const AIChatPanel: React.FC<AIChatPanelProps> = ({ open, onClose }) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [llmStatus, setLlmStatus] = useState<'uninitialized' | 'initializing' | 'ready'>('uninitialized');
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>('');

  const toggleReasoning = (index: number) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Helper to extract reasoning from streaming content
  const extractStreamingReasoning = (content: string): string => {
    const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    return thinkMatch ? thinkMatch[1].trim() : '';
  };

  // Helper to extract answer from streaming content (text outside <think> tags)
  const extractStreamingAnswer = (content: string): string => {
    return content.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();
  };

  // Initialize LLM when panel opens for the first time
  useEffect(() => {
    if (open && llmStatus === 'uninitialized') {
      initializeLLM();
    }
  }, [open, llmStatus]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeLLM = async () => {
    console.log('[AIChatPanel] Starting LLM initialization...');
    setLlmStatus('initializing');
    setLoadingProgress(0);

    try {
      console.log('[AIChatPanel] Calling llmService.initialize()...');

      // Add timeout protection (5 minutes max)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Initialization timeout after 5 minutes')), 5 * 60 * 1000)
      );

      await Promise.race([
        llmService.initialize((progress) => {
          console.log(`[AIChatPanel] Progress: ${(progress * 100).toFixed(1)}%`);
          setLoadingProgress(progress * 100);
        }),
        timeoutPromise
      ]);

      console.log('[AIChatPanel] LLM initialized successfully');
      setLlmStatus('ready');

      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your zkSalaria AI assistant. I can help you understand income proofs, tax brackets, and guide you through the payroll system. What would you like to know?",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('[AIChatPanel] Failed to initialize LLM:', error);
      setLlmStatus('uninitialized');
      setMessages([
        {
          role: 'assistant',
          content: `Failed to load AI model: ${error}. Please refresh and try again.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming || llmStatus !== 'ready') {
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Start streaming assistant response
    setIsStreaming(true);
    streamingMessageRef.current = '';

    // Add placeholder for streaming message
    const streamingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      // Stream the response
      for await (const chunk of llmService.chat(userMessage)) {
        if (!chunk.done) {
          streamingMessageRef.current += chunk.content;

          // Extract clean answer and reasoning in real-time during streaming
          const streamingAnswer = extractStreamingAnswer(streamingMessageRef.current);
          const streamingReasoning = extractStreamingReasoning(streamingMessageRef.current);

          // Update the last message with CLEAN content (no <think> tags in main content)
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: streamingAnswer, // Only clean answer in content
              reasoning: streamingReasoning, // Reasoning extracted separately
            };
            return updated;
          });
        } else {
          // Streaming complete - update with parsed reasoning and answer
          // ALWAYS use the parsed answer to ensure consistency
          // NEVER fallback to raw streamingMessageRef.current (may contain <think> tags)
          const finalContent = chunk.answer || extractStreamingAnswer(streamingMessageRef.current) || '';
          const finalReasoning = chunk.reasoning || extractStreamingReasoning(streamingMessageRef.current);

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: finalContent, // Always use parsed answer
              reasoning: finalReasoning, // Always extract reasoning if present
              answer: finalContent,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('[AIChatPanel] Chat error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${error}`,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      streamingMessageRef.current = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    llmService.clearHistory();
    setMessages([
      {
        role: 'assistant',
        content: "Conversation cleared. How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    "What income proof types are available?",
    "How do I generate a tax bracket proof?",
    "Explain zero-knowledge proofs",
    "How does the payroll system work?",
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 450, md: 500 },
          bgcolor: mode === 'dark' ? theme.colors.background.default : '#FFFFFF',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.colors.border.default}`,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : theme.colors.background.default,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <SmartToyIcon sx={{ color: theme.colors.primary[500], fontSize: 28 }} />
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  AI Assistant
                </Typography>
                <Chip
                  label={llmStatus === 'ready' ? 'Ready' : llmStatus === 'initializing' ? 'Loading...' : 'Offline'}
                  size="small"
                  color={llmStatus === 'ready' ? 'success' : llmStatus === 'initializing' ? 'warning' : 'default'}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              {llmStatus === 'ready' && (
                <IconButton size="small" onClick={handleClearHistory} title="Clear conversation">
                  <RefreshIcon />
                </IconButton>
              )}
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Loading Progress */}
        {llmStatus === 'initializing' && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
              Loading AI model... {loadingProgress.toFixed(0)}%
            </Typography>
            <LinearProgress variant="determinate" value={loadingProgress} />
            <Typography variant="caption" color={theme.colors.text.disabled} sx={{ mt: 1, display: 'block' }}>
              This may take a minute on first load. The model runs entirely in your browser for privacy.
            </Typography>
          </Box>
        )}

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 && llmStatus === 'ready' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SmartToyIcon sx={{ fontSize: 64, color: theme.colors.text.disabled, mb: 2 }} />
              <Typography variant="body1" color={theme.colors.text.secondary}>
                Start a conversation with your AI assistant
              </Typography>
            </Box>
          )}

          {messages.map((message, index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1.5}
              sx={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {message.role === 'assistant' && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.primary[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18, color: 'white' }} />
                </Box>
              )}

              <Stack spacing={1} sx={{ flex: 1 }}>
                {/* Reasoning box for assistant messages (if reasoning exists) */}
                {message.role === 'assistant' && message.reasoning && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}10` : theme.colors.background.paper,
                      border: `1px dashed ${theme.colors.primary[500]}40`,
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={
                        <PsychologyIcon
                          sx={{
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', opacity: 0.8 },
                              '50%': { transform: 'scale(1.1)', opacity: 1 },
                              '100%': { transform: 'scale(1)', opacity: 0.8 },
                            },
                            animation: isStreaming && index === messages.length - 1 ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          }}
                        />
                      }
                      onClick={() => toggleReasoning(index)}
                      sx={{
                        fontSize: '0.7rem',
                        color: theme.colors.text.disabled,
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: theme.colors.primary[500],
                        },
                      }}
                    >
                      {expandedReasoning.has(index) ? 'Hide' : 'Show'} reasoning
                      {isStreaming && index === messages.length - 1 && (
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            '@keyframes dots': {
                              '0%': { content: '"."' },
                              '33%': { content: '".."' },
                              '66%': { content: '"..."' },
                            },
                            '&::after': {
                              content: '"..."',
                              animation: 'dots 1.5s steps(1) infinite',
                            },
                          }}
                        />
                      )}
                    </Button>
                    <Collapse in={expandedReasoning.has(index)}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.6,
                          fontStyle: 'italic',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {/* Reasoning is always extracted and stored in message.reasoning */}
                        {message.reasoning}
                      </Typography>
                    </Collapse>
                  </Paper>
                )}

                {/* Main message content */}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor:
                      message.role === 'user'
                        ? theme.colors.primary[500]
                        : mode === 'dark'
                        ? theme.colors.background.paper
                        : theme.colors.background.default,
                    color: message.role === 'user' ? 'white' : theme.colors.text.primary,
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {/* Content is always clean (reasoning already extracted) */}
                    {message.content}
                    {isStreaming && index === messages.length - 1 && (
                      <span style={{ opacity: 0.5 }}>...</span>
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: 'block',
                      opacity: 0.7,
                      fontSize: '0.65rem',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Stack>

              {message.role === 'user' && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: theme.colors.secondary[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18, color: 'white' }} />
                </Box>
              )}
            </Stack>
          ))}

          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Prompts */}
        {messages.length === 1 && llmStatus === 'ready' && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 1, display: 'block' }}>
              Quick questions:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {quickPrompts.map((prompt, index) => (
                <Chip
                  key={index}
                  label={prompt}
                  size="small"
                  onClick={() => handleQuickPrompt(prompt)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme.colors.primary[50],
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.colors.border.default}`,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : theme.colors.background.default,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={llmStatus === 'ready' ? "Ask me anything..." : "Loading AI model..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={llmStatus !== 'ready' || isStreaming}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming || llmStatus !== 'ready'}
              sx={{
                bgcolor: theme.colors.primary[500],
                color: 'white',
                '&:hover': {
                  bgcolor: theme.colors.primary[700],
                },
                '&:disabled': {
                  bgcolor: theme.colors.text.disabled,
                },
              }}
            >
              {isStreaming ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Stack>
          <Typography variant="caption" color={theme.colors.text.disabled} sx={{ mt: 1, display: 'block' }}>
            AI responses are generated locally in your browser. Your data never leaves your device.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

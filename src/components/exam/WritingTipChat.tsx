import React, { useState } from 'react';
import {
  Paper,
  Text,
  TextInput,
  Stack,
  Group,
  Box,
  ActionIcon,
  Alert,
  Badge,
  Avatar
} from '@mantine/core';
import { IconSend, IconX, IconBulb, IconUser } from '@tabler/icons-react';
import { generateWritingTip, WritingTipRequest } from '../../services/writingTipService';

interface WritingTipChatProps {
  instruction: string;
  question: string;
  onClose: () => void;
  remainingTips: number;
  onTipUsed: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WritingTipChat: React.FC<WritingTipChatProps> = ({
  instruction,
  question,
  onClose,
  remainingTips,
  onTipUsed
}) => {
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!context.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: context,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setContext('');
    setIsLoading(true);
    setError(null);

    try {
      const requestData: WritingTipRequest = {
        instruction,
        question,
        context: context.trim()
      };

      const response = await generateWritingTip(requestData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onTipUsed(); // Giảm số tips
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate writing tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper
      shadow="xl"
      p="lg"
      style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        width: 500,
        maxHeight: 600,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '2px solid #15803d',
        borderRadius: '20px'
      }}
    >
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconBulb size={20} color="#15803d" />
          <Text fw={700} size="lg" c="#15803d">Aptis One Assistant</Text>
        </Group>
        <Group gap="xs">
          <Badge
            size="md"
            variant="filled"
            color="green"
          >
            {remainingTips} tips left
          </Badge>
          <ActionIcon
            size="md"
            variant="subtle"
            onClick={onClose}
            color="gray"
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Messages */}
      <Box
        style={{
          maxHeight: 350,
          overflowY: 'auto',
          marginBottom: 16
        }}
      >
        {messages.length === 0 ? (
          <Text size="md" c="dimmed" ta="center" fw={500}>
            💡 Ask for writing tips to get started...
          </Text>
        ) : (
          <Stack gap="md">
            {messages.map((message) => (
              <Box
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}
              >
                {message.type === 'assistant' && (
                  <Avatar
                    size="sm"
                    src="/assets/aptisone_logo_small.png"
                    alt="AI Assistant"
                    radius={0}
                  />
                )}

                <Paper
                  p="sm"
                  style={{
                    maxWidth: '70%',
                    backgroundColor: message.type === 'user' ? '#e3f2fd' : '#f1f8e9',
                    border: `1px solid ${message.type === 'user' ? '#2196f3' : '#4caf50'}`,
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                    {message.content}
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </Paper>

                {message.type === 'user' && (
                  <Avatar
                    size="sm"
                    color="blue"
                    variant="light"
                    radius="xl"
                  >
                    <IconUser size={16} />
                  </Avatar>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-end',
                gap: '8px'
              }}>
                <Avatar
                  size="sm"
                  src="/assets/aptisone_logo_small.png"
                  alt="AI Assistant"
                  radius={0}
                />
                <Paper
                  p="sm"
                  style={{
                    backgroundColor: '#f1f8e9',
                    border: '1px solid #4caf50',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    maxWidth: '70%'
                  }}
                >
                  <Group gap="xs">
                    <Text size="sm">Aptis One is typing...</Text>
                  </Group>
                </Paper>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {/* Input - chỉ hiển thị khi còn tips và chưa có messages */}
      {remainingTips > 0 && messages.length === 0 && (
        <Group gap="xs">
          <TextInput
            placeholder="What, can I help you build?"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={{ flex: 1 }}
            size="sm"
            radius="xl"
          />
          <ActionIcon
            onClick={handleSendMessage}
            disabled={!context.trim() || isLoading}
            color="green"
            size={40}
            variant="light"
            radius="xl"
          >
            <IconSend size={28} />
          </ActionIcon>
        </Group>
      )}

      {remainingTips <= 0 && (
        <Text size="xs" c="red" ta="center" mt="xs">
          You have used all your writing tips for this exam.
        </Text>
      )}
    </Paper>
  );
};

export default WritingTipChat; 
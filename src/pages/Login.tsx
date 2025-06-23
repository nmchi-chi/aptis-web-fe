import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Image, Stack } from '@mantine/core';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'auth/loginRequest', payload: { username, password } });
  };

  return (
    <Container size="lg" h="100vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        withBorder 
        shadow="md" 
        p="xl" 
        radius="md" 
        style={{ 
          width: '100%', 
          maxWidth: 500,
          background: 'var(--mantine-color-green-0)'
        }}
      >
        <Stack align="center" mb="xl">
          <Image
            src="/assets/logo.png"
            alt="APTIS Logo"
            width={120}
            height={120}
            fallbackSrc="https://placehold.co/120x120?text=APTIS"
          />
          <Title order={1} ta="center" fw={900} c="green.7">
            APTIS One Test
          </Title>
          <Text c="green.6" size="sm" ta="center">
            Welcome to your English assessment
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Username"
              placeholder="Enter username"
              required
              size="md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              styles={{
                label: { 
                  marginBottom: 'var(--mantine-spacing-xs)',
                  color: 'var(--mantine-color-green-7)'
                },
                input: { 
                  height: 45,
                  '&:focus': {
                    borderColor: 'var(--mantine-color-green-5)'
                  }
                }
              }}
            />
            
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              required
              size="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              styles={{
                label: { 
                  marginBottom: 'var(--mantine-spacing-xs)',
                  color: 'var(--mantine-color-green-7)'
                },
                input: { 
                  height: 45,
                  '&:focus': {
                    borderColor: 'var(--mantine-color-green-5)'
                  }
                }
              }}
            />

            <Button 
              fullWidth 
              size="md" 
              type="submit"
              mt="xl"
              color="green"
              styles={{
                root: { 
                  height: 45,
                  background: 'var(--mantine-color-green-6)',
                  '&:hover': {
                    background: 'var(--mantine-color-green-7)'
                  }
                }
              }}
            >
              Start Your Test
            </Button>
          </Stack>
        </form>

        <Text c="green.6" size="sm" ta="center" mt="xl">
          © 2025 APTIS One Test. All rights reserved.
        </Text>
      </Paper>
    </Container>
  );
};

export default Login; 
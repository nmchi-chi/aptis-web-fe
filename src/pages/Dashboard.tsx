import React from 'react';
import { useSelector } from 'react-redux';
import { Container, Paper, Text } from '@mantine/core';
import { RootState } from '../store';

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const isAdmin = user?.role === 'admin';
 
  return (
      <Container mt='lg'>
        <Paper mt='lg' mr='lg' shadow="sm" p="xl" radius="md" style={{ maxWidth: 1000, textAlign: 'center', background: '#e6f4ea' }}>
          <Text fw={700} size="xl" mb="md" style={{ color: '#26522b' }}>Welcome to APTIS ONE Test</Text>
          <Text style={{ color: '#418a47' }}>
            {isAdmin 
              ? "You are logged in as an administrator. You can manage users and exams from the navigation menu."
              : "You are logged in as a user. You can take exams from the navigation menu."}
          </Text>
        </Paper>
      </Container>
  );
};

export default Dashboard; 
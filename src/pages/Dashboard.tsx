import React from 'react';
import { useSelector } from 'react-redux';
import { Container, Paper, Text } from '@mantine/core';
import { RootState } from '../store';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <Container>
        <Paper shadow="sm" p="xl" radius="md">
          <Text fw={700} size="xl" mb="md">Welcome to APTIS</Text>
          <Text c="dimmed">
            {isAdmin 
              ? "You are logged in as an administrator. You can manage users and exams from the navigation menu."
              : "You are logged in as a user. You can take exams from the navigation menu."}
          </Text>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Dashboard; 
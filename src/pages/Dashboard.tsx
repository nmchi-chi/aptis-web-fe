import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Container, Paper, Text, Button, Group } from '@mantine/core';
import { RootState } from '../store';

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const isAdmin = user?.role === 'admin';

  const handleConsultationClick = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSfUDTrWlYZa4v53TcURRgKIN-lL8gNa_XT653_R4GDkkPvEVA/viewform', '_blank');
  };

  return (
    <Box mt='lg'>
      <Container mt='lg'>
        <Paper mt='lg' mr='lg' shadow="sm" p="xl" radius="md" style={{ maxWidth: 1200, textAlign: 'center', background: '#e6f4ea' }}>
          <Text fw={700} size="xl" mb="md" style={{ color: '#26522b' }}>Welcome to APTIS ONE Test</Text>
          <Text style={{ color: '#418a47' }}>
            {isAdmin
              ? "You are logged in as an administrator. You can manage users and exams from the navigation menu."
              : "You are logged in as a user. You can take exams from the navigation menu."}
          </Text>
        </Paper>

      </Container>

      <Box ml='0px' style={{ marginTop: '60px', textAlign: 'center' }}>
        <img
          src="/assets/info.png"
          alt="APTIS Introduction"
          style={{
            width: '120%',
            maxWidth: '1150px',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        />
      </Box>
      {(
        <Group justify="center" mt="lg">
          <Button
            mt='lg'
            size='xl'
            onClick={handleConsultationClick}
            styles={{
              root: {
                backgroundColor: '#0f5132',
                color: 'white',
                borderRadius: '32px',
                padding: '18px 40px',
                fontWeight: 700,
                fontSize: '1.4rem',
                lineHeight: '5.0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                boxShadow: '0 8px 20px rgba(15, 81, 50, 0.4)',
                transition: 'all 0.3s ease',
                overflow: 'visible',
                whiteSpace: 'nowrap',
                minWidth: '280px',
                height: '60px',
                '&:hover': {
                  backgroundColor: '#15803d !important',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 25px rgba(15, 81, 50, 0.5)',
                }
              }
            }}
          >
            Tư vấn miễn phí
          </Button>
        </Group>
      )}
    </Box>
  );
};

export default Dashboard; 
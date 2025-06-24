import { Box, useMantineTheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  return (
    <Box
      component="header"
      style={{
        background: theme.colors.green[8],
        color: '#fff',
        padding: theme.spacing.md,
        fontWeight: 600,
        fontSize: 20,
      }}
    >
      <span
        style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: 20 }}
        onClick={() => navigate('/dashboard')}
      >
        APTIS ONE - Thi 1 lần là đạt
      </span>
    </Box>
  );
};

export default Header; 
import { Box, useMantineTheme } from '@mantine/core';

const Header = () => {
  const theme = useMantineTheme();
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
      Aptis One Admin
    </Box>
  );
};

export default Header; 
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppShell, Text, Button, Group, NavLink, Stack, MantineTheme } from '@mantine/core';
import { IconUsers, IconFileText, IconClipboardText, IconLogout, IconUserCheck, IconClipboardCheck } from '@tabler/icons-react';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  // Thêm useEffect để cuộn lên đầu trang khi location thay đổi
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const isAdmin = user?.role === 'admin';

  // Hàm xử lý khi nhấn vào NavLink
  const handleNavLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0); // Cuộn lên đầu trang ngay lập tức
  };

  const navLinkStyles = (theme: MantineTheme) => ({
    root: {
      borderRadius: theme.radius.md,
      transition: 'all 0.2s ease',
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      '&[data-active]': {
        backgroundColor: theme.white,
        color: theme.colors.green[9],
        fontWeight: 700,
        border: `2px solid ${theme.colors.green[3]}`,
        '&:hover': {
          backgroundColor: theme.colors.green[0],
        },
        '& .mantine-NavLink-icon': {
          color: theme.colors.green[9],
        },
      },
      '&:not([data-active]):hover': {
        backgroundColor: theme.colors.green[0],
        color: theme.colors.green[9],
      },
      color: theme.colors.green[9],
    },
    icon: {
      color: 'inherit',
    },
  });

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 350, breakpoint: 'sm' }}
    >
      <AppShell.Header p="xs">
        <Group justify="space-between">
          <Link
            to="/dashboard"
            style={{ color: '#15803d', marginLeft: 40, fontWeight: 700, fontSize: 24, textDecoration: 'none', cursor: 'pointer', marginTop: 8, display: 'inline-block' }}
            onClick={() => window.scrollTo(0, 0)} // Cuộn lên đầu trang khi nhấn vào logo
          >
            APTIS ONE - Thi 1 lần là đạt
          </Link>
          <Group>
            <Text>Welcome, {user?.fullname}</Text>
            <Button color="red" onClick={handleLogout} leftSection={<IconLogout size="1.2rem" stroke={1.5} />}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar h='50px' p="xl">
        <Stack>
          {isAdmin ? (
            <>
              <NavLink
                label="Guest Management"
                leftSection={<IconUserCheck size="1.2rem" stroke={1.5} />}
                variant="light"
                fw={600}
                active={location.pathname === '/guest-management'}
                onClick={() => handleNavLinkClick('/guest-management')}
                my="xs"
                styles={navLinkStyles}
              />
              <NavLink
                label="User Management"
                leftSection={<IconUsers size="1.2rem" stroke={1.5} />}
                variant="light"
                fw={600}
                active={location.pathname === '/users'}
                onClick={() => handleNavLinkClick('/users')}
                my="xs"
                styles={navLinkStyles}
              />
              <NavLink
                label="Exam Management"
                leftSection={<IconFileText size="1.2rem" stroke={1.5} />}
                variant="light"
                fw={600}
                active={location.pathname === '/exam-management'}
                onClick={() => handleNavLinkClick('/exam-management')}
                my="xs"
                styles={navLinkStyles}
              />
              <NavLink
                label="Submissions Management"
                leftSection={<IconClipboardCheck size="1.2rem" stroke={1.5} />}
                variant="light"
                fw={600}
                active={location.pathname === '/submissions-management'}
                onClick={() => handleNavLinkClick('/submissions-management')}
                my="xs"
                styles={navLinkStyles}
              />
            </>
          ) : (
            <NavLink
              label="Take Exam"
              leftSection={<IconClipboardText size="1.2rem" stroke={1.5} />}
              variant="light"
              fw={600}
              active={location.pathname === '/take-exam'}
              onClick={() => handleNavLinkClick('/take-exam')}
              my="xs"
              styles={navLinkStyles}
            />
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main style={{ paddingBottom: 0 }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};

export default Layout; 

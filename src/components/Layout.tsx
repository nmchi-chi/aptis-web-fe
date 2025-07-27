import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppShell, Text, Button, Group, NavLink, Stack, MantineTheme } from '@mantine/core';
import { IconUsers, IconFileText, IconClipboardText, IconLogout, IconUserCheck, IconClipboardCheck, IconWritingSign } from '@tabler/icons-react';
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
  const isAuthInitialized = useSelector((state: RootState) => state.auth.isAuthInitialized);

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
      borderRadius: '25px',
      transition: 'all 0.3s ease',
      padding: '12px 20px',
      margin: '8px 0',
      background: 'linear-gradient(90deg, #14532d 0%, #16a34a 100%)',
      color: 'white',
      fontWeight: 600,
      border: 'none',
      boxShadow: '0 4px 12px rgba(20, 83, 45, 0.3)',
      fontSize: '1.3rem',
      '&[data-active]': {
        background: 'linear-gradient(90deg, #14532d 0%, #16a34a 100%)',
        color: 'white',
        fontWeight: 700,
        border: '2px solid white',
        boxShadow: '0 6px 16px rgba(20, 83, 45, 0.4)',
        fontSize: '1.3rem',
        '&:hover': {
          background: 'linear-gradient(90deg, #15803d 0%, #22c55e 100%)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(20, 83, 45, 0.5)',
        },
        '& .mantine-NavLink-icon': {
          color: 'white',
        },
      },
      '&:not([data-active]):hover': {
        background: 'linear-gradient(90deg, #15803d 0%, #22c55e 100%)',
        color: 'white',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(20, 83, 45, 0.4)',
        fontSize: '1.3rem',
      },
      '& .mantine-NavLink-icon': {
        color: 'white',
      },
    },
    icon: {
      color: 'white',
    },
  });

  return (
    <div
      style={{
        backgroundImage: 'url(/assets/background-navbar.png)',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        zIndex: 1000,
      }}
    >
      <AppShell
        padding="md"
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm' }}
      
      >
        <AppShell.Header p="xs">
          <Group justify="space-between">
            <Link
              to="/dashboard"
              style={{ color: '#326329', marginLeft: 30, fontWeight: 700, fontSize: 24, textDecoration: 'none', cursor: 'pointer', marginTop: 8, display: 'inline-block' }}
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

        <AppShell.Navbar p="xl" style={{ background: 'transparent', border: 'none' }}>
          <Stack>
            {isAdmin ? (
              <>
                <NavLink
                  label="Guest Management"
                  leftSection={<IconUserCheck size="1.4rem" stroke={1.5} />}
                  variant="light"
                  fw={600}
                  active={location.pathname === '/guest-management'}
                  onClick={() => handleNavLinkClick('/guest-management')}
                  my="xs"
                  styles={navLinkStyles}
                />
                <NavLink
                  label="User Management"
                  leftSection={<IconUsers size="1.4rem" stroke={1.5} />}
                  variant="light"
                  fw={600}
                  active={location.pathname === '/users'}
                  onClick={() => handleNavLinkClick('/users')}
                  my="xs"
                  styles={navLinkStyles}
                />
                <NavLink
                  label="Exam Management"
                  leftSection={<IconFileText size="1.4rem" stroke={1.5} />}
                  variant="light"
                  fw={600}
                  active={location.pathname === '/exam-management'}
                  onClick={() => handleNavLinkClick('/exam-management')}
                  my="xs"
                  styles={navLinkStyles}
                />
                <NavLink
                  label="Submissions Management"
                  leftSection={<IconClipboardCheck size="1.4rem" stroke={1.5} />}
                  variant="light"
                  fw={600}
                  active={location.pathname === '/submissions-management'}
                  onClick={() => handleNavLinkClick('/submissions-management')}
                  my="xs"
                  styles={navLinkStyles}
                />
              </>
            ) : (
              <>
                <NavLink
                  label="Take Exam"
                  leftSection={<IconClipboardText size="1.4rem" stroke={1.5} />}
                  variant="light"
                  fw={600}
                  active={location.pathname === '/take-exam'}
                  onClick={() => handleNavLinkClick('/take-exam')}
                  my="xs"
                  styles={navLinkStyles}
                />
                {isAuthInitialized && user?.role === 'member' && user?.is_commited === false && (
                  <NavLink
                    label="Commitment"
                    leftSection={<IconWritingSign size="1.4rem" stroke={1.5} />}
                    variant="light"
                    fw={600}
                    active={location.pathname === '/commitment'}
                    onClick={() => handleNavLinkClick('/commitment')}
                    my="xs"
                    styles={navLinkStyles}
                  />
                )}
              </>
            )}
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main style={{
          backgroundImage: 'url(/assets/background-navbar.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        }} >
          {children}
        </AppShell.Main>
      </AppShell>
    </div>
  );
};

export default Layout; 

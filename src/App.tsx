import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import Login from './pages/Login';
import GuestInfo from './pages/GuestInfo';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import GuestManagement from './pages/GuestManagement';
import ExamManagement from './pages/ExamManagement';
import ExamSetDetail from './pages/ExamSetDetail';
import ExamSetReading from './pages/ExamSetReading';
import ExamSetListening from './pages/ExamSetListening';
import Layout from './components/Layout';
import { RootState } from './store';
import { initializeAuth } from './store/slices/authSlice';
import Footer from './components/Footer';
import TakeExamDetail from './pages/TakeExamDetail';
import TakeExamList from './pages/TakeExamList';
import TakeExamPart from './pages/TakeExamPart';
import ViewSubmission from './pages/ViewSubmission';

const theme = createTheme({
  primaryColor: 'green',
  colors: {
    green: [
      '#e6f4ea', // 0 - nhạt nhất
      '#c2e0c6',
      '#9dcca2',
      '#78b87e',
      '#54a45a',
      '#418a47',
      '#336e39',
      '#26522b',
      '#2d5c2f', // 8 - màu chủ đạo (footer)
      '#18361d', // 9 - đậm nhất
    ],
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
  },
  components: {
    Button: {
      defaultProps: {
        color: 'green',
        variant: 'filled',
      },
    },
    Anchor: {
      defaultProps: {
        color: 'green',
        underline: 'hover',
      },
    },
  },
});

const App: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthInitialized = useSelector((state: RootState) => state.auth.isAuthInitialized);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Log auth state whenever it changes
  useEffect(() => {
    console.log('Auth State:', {
      isAuthenticated,
      user,
      userRole: user?.role,
      fullState: user
    });
  }, [isAuthenticated, user]);

  if (!isAuthInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <MantineProvider theme={theme}>
      <Notifications zIndex={2077} />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/guest" element={!isAuthenticated ? <GuestInfo /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><UserManagement /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/exam-management"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><ExamManagement /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/guest-management"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><GuestManagement /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/exam-sets/:id"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><ExamSetDetail /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/exam-sets/:id/reading"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><ExamSetReading /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/exam-sets/:id/listening"
          element={
            isAuthenticated && user?.role === 'admin'
              ? <Layout><ExamSetListening /></Layout>
              : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/take-exam"
          element={isAuthenticated ? <Layout><TakeExamList />
          </Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/take-exam/:examSetId"
          element={isAuthenticated ? <Layout><TakeExamDetail /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/take-exam/:examSetId/:partType"
          element={isAuthenticated ? <Layout><TakeExamPart /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/view-submission/:submissionId"
          element={isAuthenticated ? <Layout><ViewSubmission /></Layout> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
      <Footer />
    </MantineProvider>
  );
};

export default App; 
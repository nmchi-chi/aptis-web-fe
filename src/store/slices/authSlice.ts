import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  fullname: string;
  role: string;
}

interface JwtPayload {
  sub: string;
  user_id: number;
  role: string;
  full_name: string;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isAuthInitialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  isAuthInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp > currentTime) {
            state.isAuthenticated = true;
            state.token = token;
            // Convert JWT payload to User object
            state.user = {
              id: decoded.user_id,
              username: decoded.sub,
              fullname: decoded.full_name,
              role: decoded.role
            };
          } else {
            localStorage.removeItem('token');
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('token');
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      }
      state.isAuthInitialized = true;
    },
  },
});

export const { loginSuccess, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer; 
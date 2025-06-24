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
  id: number;
  role: string;
  fullname: string;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isAuthInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  isAuthInitialized: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
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
              id: decoded.id,
              username: decoded.sub,
              fullname: decoded.fullname,
              role: decoded.role
            };
            state.error = null;
          } else {
            localStorage.removeItem('token');
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = null;
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('token');
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.error = null;
        }
      }
      state.isAuthInitialized = true;
    },
  },
});

export const { loginSuccess, loginFailure, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer; 
import axios, { AxiosError } from 'axios';
import { User, CreateUserDto, UserListResponse, RawUserApiResponse, RoleEnum } from '../types/user';
import { store } from '../store';
import { showNotification } from '@mantine/notifications';

const API_HOST = process.env.REACT_APP_API_HOST || 'http://127.0.0.1:5055';
const API_URL = `${API_HOST}/api/admin/users`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to add token to all requests
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 403) {
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }

    const errorData = error.response?.data as any;
    let errorMessage = 'An unknown error occurred.';

    if (errorData && errorData.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        const firstError = errorData.detail[0];
        errorMessage = `Error in field '${firstError.loc.join('.')}': ${firstError.msg}`;
      }
    }

    showNotification({
      title: 'Error',
      message: errorMessage,
      color: 'red',
    });
    
    return Promise.reject(error);
  }
);

export const userService = {
  getAll: async (search: string = '', role: RoleEnum | null = null, page: number = 0, limit: number = 100): Promise<{ users: User[]; total: number }> => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      if (role) {
        params.append('role', role.toString());
      }
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get<UserListResponse>('', { params });
      const mappedUsers = response.data.items.map((rawUser: RawUserApiResponse) => ({
        id: rawUser.id,
        username: rawUser.username,
        fullname: rawUser.fullname,
        phone_number: rawUser.phone_number || '',
        role: rawUser.role,
        is_active: rawUser.is_active,
        created_at: rawUser.created_at,
        updated_at: rawUser.updated_at
      }));

      return { users: mappedUsers, total: response.data.total };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<User> => {
    try {
      const response = await api.get<RawUserApiResponse>(`/${id}`);
      const rawUser = response.data;
      return {
        id: rawUser.id,
        username: rawUser.username,
        fullname: rawUser.fullname,
        phone_number: rawUser.phone_number || '',
        role: rawUser.role,
        is_active: rawUser.is_active,
        created_at: rawUser.created_at,
        updated_at: rawUser.updated_at
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  create: async (user: CreateUserDto): Promise<User> => {
    try {
      const response = await api.post<RawUserApiResponse>('', user);
      const rawUser = response.data;
      return {
        id: rawUser.id,
        username: rawUser.username,
        fullname: rawUser.fullname,
        phone_number: rawUser.phone_number || '',
        role: rawUser.role,
        is_active: rawUser.is_active,
        created_at: rawUser.created_at,
        updated_at: rawUser.updated_at
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  deactivate: async (id: number): Promise<void> => {
    try {
      await api.patch(`/${id}/deactivate`);
    } catch (error) {
      console.error(`Error deactivating user ${id}:`, error);
      throw error;
    }
  },

  reactivate: async (id: number): Promise<void> => {
    try {
      await api.patch(`/${id}/activate`);
    } catch (error) {
      console.error(`Error reactivating user ${id}:`, error);
      throw error;
    }
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    try {
      await api.patch(`/${id}/password`, { new_password: newPassword });
    } catch (error) {
      console.error(`Error resetting password for user ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}; 
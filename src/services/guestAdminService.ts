import axios, { AxiosError } from 'axios';
import { Guest, GuestListResponse, GuestListParams } from '../types/guest';
import { store } from '../store';
import { showNotification } from '@mantine/notifications';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn';
const API_URL = `${API_HOST}/admin/guest`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add interceptor to include auth token
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('Guest Admin API Error:', error);
    
    let errorMessage = 'Có lỗi xảy ra';
    
    if (error.response?.data) {
      const errorData = error.response.data as any;
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification({
      title: 'Lỗi',
      message: errorMessage,
      color: 'red',
    });
    
    return Promise.reject(error);
  }
);

export const guestAdminService = {
  // Get all guests with pagination
  async getAll(params: GuestListParams = {}): Promise<{ guests: Guest[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      
      console.log('🚀 Fetching guests with params:', params);
      const response = await api.get<GuestListResponse>('', { params: queryParams });
      console.log('✅ Guests response:', response.data);
      
      return { 
        guests: response.data.items, 
        total: response.data.total 
      };
    } catch (error) {
      console.error('❌ Error fetching guests:', error);
      throw error;
    }
  },

  // Set guest as called/uncalled
  async setCalled(guestId: number): Promise<void> {
    try {
      console.log('🚀 Setting guest as called:', guestId);
      await api.patch(`/${guestId}`);
      console.log('✅ Guest call status updated');
      
      showNotification({
        title: 'Thành công',
        message: 'Đã cập nhật trạng thái gọi khách hàng',
        color: 'green',
      });
    } catch (error) {
      console.error('❌ Error setting guest called status:', error);
      throw error;
    }
  },

    async setUnCalled(guestId: number): Promise<void> {
    try {
      console.log('🚀 Setting guest as called:', guestId);
      await api.patch(`/${guestId}/unmask`);
      console.log('✅ Guest call status updated');
      
      showNotification({
        title: 'Thành công',
        message: 'Đã cập nhật trạng thái chưa gọi khách hàng',
        color: 'green',
      });
    } catch (error) {
      console.error('❌ Error setting guest called status:', error);
      throw error;
    }
  },

  // Delete guest
  async delete(guestId: number): Promise<void> {
    try {
      console.log('🚀 Deleting guest:', guestId);
      await api.delete(`/${guestId}`);
      console.log('✅ Guest deleted');
      
      showNotification({
        title: 'Thành công',
        message: 'Đã xóa khách hàng',
        color: 'green',
      });
    } catch (error) {
      console.error('❌ Error deleting guest:', error);
      throw error;
    }
  }
};

export default guestAdminService;

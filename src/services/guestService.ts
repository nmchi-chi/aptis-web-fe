import axios, { AxiosError } from 'axios';
import { showNotification } from '@mantine/notifications';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';
const GUEST_API_URL = `${API_HOST}/guest`;
console.log('🧪 GUEST API_HOST =', API_HOST);

export interface GuestInfoRequest {
  fullname: string;
  phone_number: string;
}

export interface GuestInfoResponse {
  access_token: string;
  token_type: string;
}

const guestApi = axios.create({
  baseURL: GUEST_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Guest service functions
export const guestService = {
  async submitInfo(guestInfo: GuestInfoRequest): Promise<GuestInfoResponse> {
    try {
      console.log('🚀 Submitting guest info:', guestInfo);
      const response = await guestApi.post('/info', guestInfo);
      console.log('✅ Guest info response:', response.data);
      
      showNotification({
        title: 'Thành công',
        message: 'Cảm ơn bạn đã cung cấp thông tin!',
        color: 'green',
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Guest info error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi gửi thông tin';
      
      if (error instanceof AxiosError) {
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = 'Thông tin không hợp lệ, vui lòng kiểm tra lại';
        } else if (error.response?.status === 500) {
          errorMessage = 'Lỗi hệ thống, vui lòng thử lại sau';
        }
      }
      
      showNotification({
        title: 'Lỗi',
        message: errorMessage,
        color: 'red',
      });
      
      throw new Error(errorMessage);
    }
  }
};

export default guestService;

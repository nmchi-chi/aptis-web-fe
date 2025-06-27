import axios, { AxiosError } from 'axios';
import { store } from '../store';
import { showNotification } from '@mantine/notifications';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';
const USER_API_URL = `${API_HOST}/user`;
console.log('🧪 API_HOST =', API_HOST);

const userApi = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

userApi.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userApi.interceptors.response.use(
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
        errorMessage = `Error in field '${firstError.loc.join('.') }': ${firstError.msg}`;
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

export const userExamService = {
  getUserExamSets: async (search = '', page = 1, limit = 20) => {
    const res = await userApi.get('/exam-sets', {
      params: { search, page, limit }
    });
    return res.data;
  },
  getUserExamSetDetail: async (examSetId: number) => {
    const res = await userApi.get(`/exam-sets/${examSetId}`);
    return res.data;
  },
  getUserExamDetail: async (examId: number) => {
    const res = await userApi.get(`/exam/${examId}`);
    return res.data;
  },
  getUserExamAudio: async (data: { audio_path: string }) => {
    const res = await userApi.post('/exam-audio', data);
    return res.data;
  },
  submitExam: async (examId: number, data: { json_data: any; score: string }) => {
    const res = await userApi.post(`/exam/${examId}/submission`, data);
    return res.data;
  },
  getSubmission: async (submissionId: number) => {
    const res = await userApi.get(`/submission/${submissionId}`);
    return res.data;
  },
  getUserSubmissions: async (examId: number) => {
    try {
      const res = await userApi.get(`/exam/${examId}/submissions`);
      return res.data;
    } catch (error) {
      // Return empty array if no submissions found
      return [];
    }
  }
};
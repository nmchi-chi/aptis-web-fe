import axios, { AxiosError } from 'axios';
import { ExamSet, CreateExamSetDto, UpdateExamSetDto, ExamSetListResponse, CreateReadingExamPartDto, ExamPartResponse, ExamPartDetail } from '../types/examSet';
import { store } from '../store';
import { showNotification } from '@mantine/notifications';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn';
const API_URL = `${API_HOST}/api/admin/exam-sets`;
const EXAM_API_URL = `${API_HOST}/api/admin/exam`;
const USER_API_URL = `${API_HOST}/api/user`;
console.log('🧪 API_HOST =', API_HOST);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

const examApi = axios.create({
  baseURL: EXAM_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

const userApi = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add interceptors to both instances
[api, examApi, userApi].forEach(instance => {
  instance.interceptors.request.use((config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
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
});

export const examSetService = {
  getAll: async (search: string = '', page: number = 0, limit: number = 100): Promise<{ examSets: ExamSet[]; total: number }> => {
        console.log(search);

    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('page', page.toString());
      params.append('limit', limit.toString());
    console.log('🧪 API_HOST =', params);

      const response = await api.get<ExamSetListResponse>('', { params });
    console.log(response);

      return { examSets: response.data.items, total: response.data.total };
    } catch (error) {
      console.error('Error fetching exam sets:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ExamSet> => {
    try {
      const response = await api.get<ExamSet>(`/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching exam set ${id}:`, error);
      throw error;
    }
  },

  create: async (examSet: CreateExamSetDto): Promise<ExamSet> => {
    try {
      const response = await api.post<ExamSet>('', examSet);
      return response.data;
    } catch (error) {
      console.error('Error creating exam set:', error);
      throw error;
    }
  },

  update: async (id: number, examSet: UpdateExamSetDto): Promise<ExamSet> => {
    try {
      const response = await api.put<ExamSet>(`/${id}`, examSet);
      return response.data;
    } catch (error) {
      console.error(`Error updating exam set ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/${id}`);
    } catch (error) {
      console.error(`Error deleting exam set ${id}:`, error);
      throw error;
    }
  },

  updateReadingExamFile: async (examId: number, file: File): Promise<ExamPartResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await examApi.patch<ExamPartResponse>(`/reading/${examId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating reading exam file for exam ${examId}:`, error);
      throw error;
    }
  },

  uploadReadingExamPart: async (examSetId: number, data: CreateReadingExamPartDto): Promise<ExamPartResponse> => {
    try {
      const formData = new FormData();
      formData.append('exam_part_code', data.exam_part_code);
      formData.append('title_for_part', data.title_for_part);
      formData.append('time_limit_minutes_for_part', data.time_limit_minutes_for_part.toString());
      formData.append('file', data.file);

      const response = await api.post<ExamPartResponse>(`/${examSetId}/reading-exam`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading reading exam part for exam set ${examSetId}:`, error);
      throw error;
    }
  },

  uploadListeningExamPart: async (examSetId: number, data: CreateReadingExamPartDto): Promise<ExamPartResponse> => {
    try {
      const formData = new FormData();
      formData.append('exam_part_code', data.exam_part_code);
      formData.append('title_for_part', data.title_for_part);
      formData.append('time_limit_minutes_for_part', data.time_limit_minutes_for_part.toString());
      formData.append('file', data.file);

      const response = await api.post<ExamPartResponse>(`/${examSetId}/listening-exam`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading listening exam part for exam set ${examSetId}:`, error);
      throw error;
    }
  },

  getExamPartDetail: async (examId: number): Promise<ExamPartDetail> => {
    try {
      const response = await examApi.get<ExamPartDetail>(`/${examId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching exam part detail ${examId}:`, error);
      throw error;
    }
  },

  getExamParts: async (examSetId: number): Promise<ExamPartDetail> => {
    try {
      const response = await examApi.get<ExamPartDetail>(`/${examSetId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching exam parts for exam set ${examSetId}:`, error);
      throw error;
    }
  },

  getAudioBase64: async (audioPath: string): Promise<string | null> => {
    try {
      const response = await userApi.post<{ audio: string }>(
        '/exam-audio',
        { audio_path: audioPath }
      );
      return response.data.audio;
    } catch (error: any) {
      // Không showNotification ở đây nữa, vì interceptor đã làm rồi!
      console.error('Error fetching audio base64:', error);
      return null;
    }
  },

  getGoogleDriveAudioUrl: async (audioPath: string): Promise<string | null> => {
    if (!audioPath.startsWith('https://drive.google.com/')) return null;
    const match = audioPath.match(/\/d\/([^/]+)/);
    const fileId = match ? match[1] : null;
    if (!fileId) return null;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  updateListeningExamFile: async (examId: number, file: File): Promise<ExamPartResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await examApi.patch<ExamPartResponse>(`/listening/${examId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating listening exam file for exam ${examId}:`, error);
      throw error;
    }
  },
}; 
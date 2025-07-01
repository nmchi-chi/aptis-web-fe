import axios from 'axios';
import { SubmissionsResponse, SubmissionFilters, SubmissionDetail, SubmissionScoreData } from '../types/submission';
import { store } from '../store';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';
const API_URL = `${API_HOST}/admin`;

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

export const submissionService = {
  getSubmissions: async (filters: SubmissionFilters = {}): Promise<SubmissionsResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.fullname) {
        params.append('fullname', filters.fullname);
      }
      if (filters.is_scored !== undefined) {
        params.append('is_scored', filters.is_scored.toString());
      }
      if (filters.exam_code) {
        params.append('exam_code', filters.exam_code);
      }
      if (filters.exam_type) {
        params.append('exam_type', filters.exam_type);
      }
      if (filters.exam_set_code) {
        params.append('exam_set_code', filters.exam_set_code);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await api.get<SubmissionsResponse>(`/submissions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  getSubmissionDetail: async (submissionId: number): Promise<SubmissionDetail> => {
    try {
      const response = await api.get<SubmissionDetail>(`/submission/${submissionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching submission detail ${submissionId}:`, error);
      throw error;
    }
  },

  scoreSubmission: async (submissionId: number, data: SubmissionScoreData): Promise<SubmissionDetail> => {
    try {
      const response = await api.patch<SubmissionDetail>(`/submission/${submissionId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error scoring submission ${submissionId}:`, error);
      throw error;
    }
  },
};

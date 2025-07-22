import axios from 'axios';
import { store } from '../store';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';
const COMMITMENT_API_URL = `${API_HOST}/commitment`;

const commitmentApi = axios.create({
  baseURL: COMMITMENT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

commitmentApi.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const commitmentService = {
  generateCommitment: async (data: any) => {
    const res = await commitmentApi.post('/generate', data);
    return res.data;
  },
  sendCommitmentEmail: async (data: any) => {
    const res = await commitmentApi.post('/send_commitment_email', data);
    return res.data;
  }
}; 
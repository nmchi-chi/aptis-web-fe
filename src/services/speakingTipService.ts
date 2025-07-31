import axios from 'axios';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';

export interface SpeakingTipRequest {
  instruction: string;
  question: string;
  context: string;
  image_paths: string[];
}

export interface SpeakingTipResponse {
  message: string;
  // Add other fields as needed based on API response
}

export const generateSpeakingTip = async (data: SpeakingTipRequest): Promise<SpeakingTipResponse> => {
  try {
    const response = await axios.post(`${API_HOST}/user/speaking/generate`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error generating speaking tip:', error);
    throw error;
  }
}; 
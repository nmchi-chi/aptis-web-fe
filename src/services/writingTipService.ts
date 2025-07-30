import axios from 'axios';

const API_HOST = process.env.REACT_APP_API_URL || 'https://api.aptisone-test.io.vn/api';

export interface WritingTipRequest {
  instruction: string;
  question: string;
  context: string;
}

export interface WritingTipResponse {
  message: string;
  // Add other fields as needed based on API response
}

export const generateWritingTip = async (data: WritingTipRequest): Promise<WritingTipResponse> => {
  try {
    const response = await axios.post(`${API_HOST}/user/writing/generate`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error generating writing tip:', error);
    throw error;
  }
}; 
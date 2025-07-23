export interface Submission {
  id: number;
  user_id: number;
  exam_id: number;
  exam_type: 'reading' | 'listening' | 'speaking' | 'writing' | 'g_v';
  exam_code: string;
  exam_set_code: string;
  exam_set_title: string;
  user_name: string;
  score: string | null;
  is_scored: boolean;
}

export interface SubmissionDetail {
  id: number;
  user_id: number;
  exam_id: number;
  exam_type: 'reading' | 'listening' | 'speaking' | 'writing' | 'g_v';
  exam_code: string;
  exam_set_code: string;
  exam_set_title: string;
  user_name: string;
  score: string | null;
  is_scored: boolean;
  answer: any; // Contains the submission data (userAnswers, examData, etc.)
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionsResponse {
  total: number;
  page: number;
  limit: number;
  items: Submission[];
}

export interface SubmissionFilters {
  fullname?: string;
  is_scored?: boolean;
  exam_code?: string;
  exam_type?: 'reading' | 'listening' | 'speaking' | 'writing' | 'g_v';
  exam_set_code?: string;
  page?: number;
  limit?: number;
}

export type ExamType = 'reading' | 'listening' | 'speaking' | 'writing' | 'g_v';

export interface SubmissionScoreData {
  score: string;
  json_data: any;
}

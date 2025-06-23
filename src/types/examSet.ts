export interface ExamSet {
  id: number;
  set_code: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  exams?: Exam[];
}

export interface Exam {
  id: number;
  exam_code: string;
  exam_type: string;
  description?: string;
  time_limit: number;
}

export interface CreateExamSetDto {
  set_code: string;
  title: string;
}

export interface UpdateExamSetDto {
  set_code?: string;
  title?: string;
}

export interface ExamSetListResponse {
  items: ExamSet[];
  total: number;
  limit: number;
  page: number;
}

export interface CreateReadingExamPartDto {
  exam_part_code: string;
  title_for_part: string;
  time_limit_minutes_for_part: number;
  file: File;
}

export interface ExamPartResponse {
  exam_id: number;
  exam_code: string;
  title: string;
  exam_type: string;
  time_limit_minutes: number;
  message?: string;
}

export interface Question {
  sentence?: string;
  text?: string;
  correct_answer: string;
  options?: string[];
}

export interface QuestionGroup {
  group: number;
  questions: Question[];
}

export interface Sentence {
  key: number;
  text: string;
  is_example_first: boolean;
}

export interface TopicGroup {
  topic: string;
  sentences: Sentence[];
}

export interface PersonQuestion {
  text: string;
  correct_answer: string;
}

export interface ReadingPart3Group {
  topic: string;
  person_A: string;
  person_B: string;
  person_C: string;
  person_D: string;
  questions: PersonQuestion[];
}

export interface ReadingPart4Group {
  topic: string;
  options: string[];
  questions: {
    text: string;
    correct_answer: number;
  }[];
}

export interface ExamPartDetail {
  part1?: QuestionGroup[];
  part2?: TopicGroup[];
  part3?: ReadingPart3Group[];
  part4?: ReadingPart4Group[];
} 
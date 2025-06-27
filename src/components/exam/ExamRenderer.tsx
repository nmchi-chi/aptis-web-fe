import React from 'react';
import { Text } from '@mantine/core';
import { DropResult } from 'react-beautiful-dnd';
import TakeListeningExam from './TakeListeningExam';
import TakeReadingExam from './TakeReadingExam';

interface ExamRendererProps {
  partType: string;
  exam: any;
  userAnswers: any;
  userPart2Answers?: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
  onPart2AnswerChange?: (key: string, value: string | string[]) => void;
  onDragEnd?: (result: DropResult, topicIdx: number) => void;
}

const ExamRenderer: React.FC<ExamRendererProps> = ({
  partType,
  exam,
  userAnswers,
  userPart2Answers,
  submitted,
  onAnswerChange,
  onPart2AnswerChange,
  onDragEnd
}) => {
  if (!exam) {
    return <Text c="red">Đang tải dữ liệu bài thi...</Text>;
  }

  switch (partType) {
    case 'reading':
      return (
        <TakeReadingExam
          exam={exam}
          userAnswers={userAnswers}
          submitted={submitted}
          onAnswerChange={onAnswerChange}
          onDragEnd={onDragEnd!}
        />
      );
    
    case 'listening':
      return (
        <TakeListeningExam
          exam={exam}
          userAnswers={userAnswers}
          userPart2Answers={userPart2Answers}
          submitted={submitted}
          onAnswerChange={onAnswerChange}
          onPart2AnswerChange={onPart2AnswerChange!}
        />
      );
    
    case 'writing':
      // Placeholder for future writing component
      return <Text c="orange">Writing exam component will be implemented here</Text>;
    
    case 'speaking':
      // Placeholder for future speaking component
      return <Text c="orange">Speaking exam component will be implemented here</Text>;
    
    default:
      return <Text c="red">Loại bài thi không được hỗ trợ: {partType}</Text>;
  }
};

export default ExamRenderer;

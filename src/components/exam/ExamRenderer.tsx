import React from 'react';
import { Text } from '@mantine/core';
import { DropResult } from 'react-beautiful-dnd';
import TakeListeningExam from './TakeListeningExam';
import TakeReadingExam from './TakeReadingExam';
import TakeSpeakingExam from './TakeSpeakingExam';
import TakeWritingExam from './TakeWritingExam';
import TakeGrammaVocabExam from './TakeGrammaVocabExam';

interface ExamRendererProps {
  partType: string;
  exam: any;
  userAnswers: any;
  userPart2Answers?: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
  onPart2AnswerChange?: (key: string, value: string | string[]) => void;
  onDragEnd?: (result: DropResult, topicIdx: number) => void;
  onSpeakingSubmit?: (audioPaths: string[]) => void;
  score?: string;
  isViewMode?: boolean;
}

const ExamRenderer: React.FC<ExamRendererProps> = ({
  partType,
  exam,
  userAnswers,
  userPart2Answers,
  submitted,
  onAnswerChange,
  onPart2AnswerChange,
  onDragEnd,
  onSpeakingSubmit,
  score,
  isViewMode = false
}) => {
  console.log('ExamRenderer - partType:', partType);
  console.log('ExamRenderer - exam:', exam);

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
      console.log('ExamRenderer - rendering TakeWritingExam');
      return (
        <TakeWritingExam
          exam={exam}
          userAnswers={userAnswers}
          submitted={submitted}
          onAnswerChange={onAnswerChange}
        />
      );

    case 'speaking':
      return (
        <TakeSpeakingExam
          exam={exam}
          onSubmit={onSpeakingSubmit!}
        />
      );

    case 'g_v':
      return (
        <TakeGrammaVocabExam
          exam={exam}
          userAnswers={userAnswers}
          submitted={submitted}
          onAnswerChange={onAnswerChange}
        />
      );


    default:
      return <Text c="red">Loại bài thi không được hỗ trợ: {partType}</Text>;
  }
};

export default ExamRenderer;
